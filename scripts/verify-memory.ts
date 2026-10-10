import { PAYERS } from "../shared/payers.ts";
import { reviewAdmission, recordOutcome } from "../server/review.ts";
import type { AdmissionCase, PayerId } from "../shared/types.ts";

const documents = {
  preAuthorizationForm: true,
  insurerCard: true,
  identityProof: "aadhaar" as const,
  policyCopy: true,
  admissionAdvice: true,
  investigationReports: true,
  investigationReportsOnLetterheadAndDated: true,
  investigationReportsMatchDiagnosis: true,
  cbcAttached: true,
  fitnessCertificate: true,
  fitnessCertificateAgeDays: 4,
  signedSurgicalConsent: true,
  itemisedEstimate: true,
  mlcFir: false,
};

function caseFor(payerId: PayerId): AdmissionCase {
  return {
    patientName: "Verification patient",
    age: 0,
    gender: "",
    mrn: "",
    ward: "",
    scheduledAt: "",
    hospitalId: "sri-venkateswara-hyderabad",
    diagnosis: "Acute calculus cholecystitis",
    procedure: "Laparoscopic cholecystectomy",
    payerId,
    packageName: "Laparoscopic cholecystectomy",
    packageCode: "JRY-GEN-042",
    accidentCase: false,
    documents,
    clinicalNote: "",
  };
}

for (const payer of PAYERS) {
  const result = await reviewAdmission(caseFor(payer.id));
  const evidence = [...result.recalled, ...result.outcomes, ...result.decision.basedOn];
  if (evidence.length === 0) {
    throw new Error(`${payer.name} review returned no cited memories.`);
  }
  for (const otherPayer of PAYERS.filter((item) => item.id !== payer.id)) {
    if (evidence.some((item) => item.text.includes(otherPayer.name))) {
      throw new Error(`${payer.name} review cited content from another insurer.`);
    }
  }
  console.log(`${payer.name}: cited ${evidence.length} entries from ${result.bankId} only`);
}

const payerId: PayerId = "bharat-arogya";
const denialReason =
  "Verification denial: despite the exact package name and dated letterhead reports, the insurer required a second admission advice copy.";
const saved = await recordOutcome({
  payerId,
  caseSnapshot: caseFor(payerId),
  outcome: "denied",
  reason: denialReason,
});
const updated = await reviewAdmission(caseFor(payerId));
const newEvidence = [...updated.outcomes, ...updated.recalled, ...updated.decision.basedOn].find(
  (item) =>
    item.id === saved.documentId ||
    /second (?:copy of )?the? admission advice|second admission advice copy/i.test(item.text),
);
if (!newEvidence) {
  throw new Error("The new Bharat Arogya denial was not cited by the next review.");
}
console.log("Bharat Arogya: newly recorded denial is present in the next review evidence.");
