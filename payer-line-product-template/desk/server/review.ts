import type { AdmissionCase, OutcomeInput, ReviewDecision, ReviewResponse } from "@shared/types";
import { outcomeInputError } from "@shared/outcome-validation";
import { assessPacket } from "@shared/packet";
import { payerById } from "@shared/payers";
import { recallCase, reflectCase, retainOutcome, loadRecentOutcomes, procedureTag } from "./hindsight";

export async function reviewAdmission(admission: AdmissionCase): Promise<ReviewResponse> {
  const payer = payerById(admission.payerId);
  const query = caseQuery(admission, payer.name);
  const checklist = assessPacket(admission);
  const [recalled, reflection, outcomes] = await Promise.all([
    recallCase(admission.payerId, query, admission.procedure),
    reflectCase(admission.payerId, query, admission.procedure),
    loadRecentOutcomes(admission.payerId, admission.procedure, admission.packageName),
  ]);

  return {
    payer,
    bankId: payer.bankId,
    reviewedAt: new Date().toISOString(),
    recalled,
    outcomes,
    ...stabilizeDecision(
      normalizeDecision(reflection.structured, reflection.narrative, reflection.basedOn),
      checklist,
    ),
  };
}

export async function recordOutcome(input: OutcomeInput): Promise<{ documentId: string }> {
  const validationError = outcomeInputError(input);
  if (validationError) throw new Error(validationError);
  const payer = payerById(input.payerId);
  const admission = input.caseSnapshot;
  const documentId = `live-${payer.id}-${Date.now()}`;
  const content = [
    `On ${new Date().toISOString()} the cashless desk recorded a ${input.outcome} from ${payer.name}.`,
    `Procedure: ${admission.procedure}.`,
    ...documentFacts(admission),
    input.outcome === "approved"
      ? approvalReviewMemory(input, admission.patientName, admission.mrn)
      : `Insurer reason: ${sanitizeReason(input.reason ?? "", admission.patientName, admission.mrn)}`,
  ].join("\n");

  await retainOutcome({
    payerId: input.payerId,
    content,
    documentId,
    tags: [procedureTag(admission.procedure), `outcome:${input.outcome}`, "source:live"],
  });
  return { documentId };
}

export function validateOutcomeInput(input: OutcomeInput): string | null {
  if (!input?.payerId || !input.caseSnapshot || !input.outcome) {
    return "An outcome needs the case and the insurer's result.";
  }
  return outcomeInputError(input);
}

function approvalReviewMemory(
  input: OutcomeInput,
  patientName: string,
  mrn: string,
): string {
  const review = input.approvalReview!;
  const parts = [
    `Approved ₹${formatRupees(review.amountApproved)} of ₹${formatRupees(review.amountRequested)} in ${review.decisionMinutes} minutes.`,
    review.queryRaisedFirst
      ? `A query was raised first about ${review.queriedDocument}.`
      : "No query was raised first.",
  ];
  if (review.offChecklistDocument?.trim()) {
    parts.push(
      `The insurer asked for an off-checklist document: ${sanitizeReason(review.offChecklistDocument, patientName, mrn)}.`,
    );
  }
  if (review.note?.trim()) {
    parts.push(`Review note: ${sanitizeReason(review.note, patientName, mrn)}.`);
  }
  return parts.join(" ");
}

function formatRupees(value: number): string {
  return Math.round(value).toLocaleString("en-IN");
}

function caseQuery(admission: AdmissionCase, payerName: string): string {
  return [
    `Cashless file for insurer ${payerName}.`,
    `Procedure: ${admission.procedure}.`,
    `Package name on the form: "${admission.packageName}".`,
    `Package code on the form: "${admission.packageCode}".`,
    ...documentFacts(admission),
    "Decide whether the desk should hold or send this file.",
    "Use only this insurer's history.",
    "If the written policy would allow the file but past outcomes would not, hold it and set policy_conflict true.",
    "The package name or scheme package code must match the procedure where this insurer requires it.",
    "fixes and do_not_add must be short document names only.",
    "Do not write long sentences in fixes or do_not_add.",
    "evidence lists the dated past outcomes you relied on.",
    "confidence is thin below two agreeing outcomes, moderate at two, and strong at three or more.",
  ].join("\n");
}

function documentFacts(admission: AdmissionCase): string[] {
  const documents = admission.documents;
  return [
    `Pre-Authorisation Request Form signed: ${yesNo(documents.preAuthorizationForm)}.`,
    `Insurer e-card attached: ${yesNo(documents.insurerCard)}.`,
    `Identity proof type: ${documents.identityProof}.`,
    `Policy copy attached: ${yesNo(documents.policyCopy)}.`,
    `Doctor's admission advice attached: ${yesNo(documents.admissionAdvice)}.`,
    `Investigation reports attached: ${yesNo(documents.investigationReports)}.`,
    `Investigation reports have dated hospital letterhead: ${yesNo(documents.investigationReportsOnLetterheadAndDated)}.`,
    `Laboratory reports match the diagnosis: ${yesNo(documents.investigationReportsMatchDiagnosis)}.`,
    `CBC attached: ${yesNo(documents.cbcAttached)}.`,
    `Physician fitness certificate attached: ${yesNo(documents.fitnessCertificate)}; age in days: ${documents.fitnessCertificateAgeDays}.`,
    `Signed surgical consent attached: ${yesNo(documents.signedSurgicalConsent)}.`,
    `Itemised estimate attached: ${yesNo(documents.itemisedEstimate)}.`,
    `Accident case: ${yesNo(admission.accidentCase)}.`,
    `MLC / FIR copy attached: ${yesNo(documents.mlcFir)}.`,
  ];
}

function stabilizeDecision(
  decision: ReviewDecision,
  checklist: ReturnType<typeof assessPacket>,
): Pick<ReviewResponse, "decision" | "memoryDecision" | "checklist"> {
  return {
    decision: {
      ...decision,
      decision: checklist.mustHold ? "hold" : decision.decision,
      policyConflict: decision.policyConflict || checklist.policyConflict,
    },
    memoryDecision: decision,
    checklist: {
      decision: checklist.mustHold ? "hold" : "send",
      summary: checklist.message,
      fixes: checklist.missingRequired,
      doNotAdd: checklist.removeFromPacket,
    },
  };
}

function normalizeDecision(
  structured: Record<string, unknown> | null,
  narrative: string,
  basedOn: ReviewDecision["basedOn"],
): ReviewDecision {
  const decision = structured?.decision === "send" ? "send" : "hold";
  const confidence = ["thin", "moderate", "strong"].includes(String(structured?.confidence))
    ? (structured?.confidence as ReviewDecision["confidence"])
    : "thin";
  return {
    decision,
    confidence,
    policyConflict: Boolean(structured?.policy_conflict),
    summary: stringField(structured?.summary, narrative.slice(0, 420)),
    fixes: stringList(structured?.fixes),
    doNotAdd: stringList(structured?.do_not_add),
    evidence: stringList(structured?.evidence),
    narrative,
    basedOn,
  };
}

function stringField(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function yesNo(value: boolean): string {
  return value ? "yes" : "no";
}

function sanitizeReason(reason: string, patientName: string, mrn: string): string {
  let sanitized = reason.trim();
  for (const identifier of [patientName, mrn]) {
    if (identifier.trim()) {
      sanitized = sanitized.replace(new RegExp(escapeRegExp(identifier.trim()), "gi"), "[redacted]");
    }
  }
  return sanitized
    .replace(/\b(?:MRN|medical record(?: number)?|patient ID)\s*[:#-]?\s*[A-Z0-9-]{4,}\b/gi, "[redacted]")
    .replace(/\bAadhaar(?: number)?\s*[:#-]?\s*\d{12}\b/gi, "[redacted]")
    .replace(/\b(?:phone|mobile|contact)\s*[:#-]?\s*\+?\d[\d -]{8,}\d\b/gi, "[redacted]")
    .replace(/\b\d{8,}\b/g, "[redacted]");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
