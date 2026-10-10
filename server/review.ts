import type { AdmissionCase, OutcomeInput, ReviewDecision, ReviewResponse } from "@shared/types";
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
  const payer = payerById(input.payerId);
  const admission = input.caseSnapshot;
  const documentId = `live-${payer.id}-${Date.now()}`;
  const content = [
    `On ${new Date().toISOString()} the cashless desk recorded a ${input.outcome} from ${payer.name}.`,
    `Procedure: ${admission.procedure}.`,
    `Package name submitted: "${admission.packageName}".`,
    `Ultrasound attached: ${yesNo(admission.ultrasoundAttached)}. Ultrasound date on hospital letterhead: ${yesNo(admission.ultrasoundDateOnLetterhead)}.`,
    `Culture report attached: ${yesNo(admission.cultureReportAttached)}. Culture contradicted the diagnosis: ${yesNo(admission.cultureContradictsDiagnosis)}.`,
    `Fitness certificate attached: ${yesNo(admission.fitnessCertificateAttached)}. Fitness certificate age in days: ${admission.fitnessCertificateAgeDays}.`,
    `Signed surgical consent attached: ${yesNo(admission.consentAttached)}. Itemised estimate attached: ${yesNo(admission.itemisedEstimateAttached)}.`,
    `Photo identity attached: ${yesNo(admission.photoIdAttached)}. Policy e-card attached: ${yesNo(admission.policyCardAttached)}. CBC attached: ${yesNo(admission.cbcAttached)}.`,
    `Desk reason: ${sanitizeReason(input.reason, admission.patientName, admission.mrn)}`,
    `This outcome is evidence for the next ${payer.name} file of the same procedure.`,
  ].join("\n");

  await retainOutcome({
    payerId: input.payerId,
    content,
    documentId,
    tags: [procedureTag(admission.procedure), `outcome:${input.outcome}`, "source:live"],
  });
  return { documentId };
}

function caseQuery(admission: AdmissionCase, payerName: string): string {
  return [
    `Today's cashless file is for ${payerName}.`,
    `Procedure: ${admission.procedure}.`,
    `The correct package name is the procedure name: "${admission.procedure}".`,
    `Package name on the form: "${admission.packageName}".`,
    `Ultrasound attached: ${yesNo(admission.ultrasoundAttached)}.`,
    `Ultrasound date printed on hospital letterhead: ${yesNo(admission.ultrasoundDateOnLetterhead)}.`,
    `Culture report attached: ${yesNo(admission.cultureReportAttached)}.`,
    `Culture report contradicts the diagnosis: ${yesNo(admission.cultureContradictsDiagnosis)}.`,
    `Physician fitness certificate attached: ${yesNo(admission.fitnessCertificateAttached)}.`,
    `Fitness certificate age in days: ${admission.fitnessCertificateAgeDays}.`,
    `Signed surgical consent attached: ${yesNo(admission.consentAttached)}.`,
    `Itemised estimate attached: ${yesNo(admission.itemisedEstimateAttached)}.`,
    `Photo identity attached: ${yesNo(admission.photoIdAttached)}.`,
    `Policy e-card attached: ${yesNo(admission.policyCardAttached)}.`,
    `CBC report attached: ${yesNo(admission.cbcAttached)}.`,
    "Decide whether the desk should hold or send this file.",
    "Use only this insurer's history.",
    "If the written policy would allow the file but past outcomes would not, hold it and set policy_conflict true.",
    "fixes and do_not_add must be short document names only, for example: Package name, Ultrasound on letterhead, Matching culture report, Conflicting culture report, Fitness certificate, Surgical consent, Itemised estimate, Lump-sum estimate, Unsigned consent, Photo identity, Policy e-card, CBC.",
    "Do not write long sentences in fixes or do_not_add.",
    "evidence lists the dated past outcomes you relied on.",
    "confidence is thin below two agreeing outcomes, moderate at two, and strong at three or more.",
  ].join("\n");
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
