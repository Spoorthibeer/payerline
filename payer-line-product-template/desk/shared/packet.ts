import type { AdmissionCase, DocumentChecklist, PayerId } from "./types";
import { procedureByName } from "./catalog";

export interface PacketAssessment {
  /** Documents missing or wrong in today's selected packet. */
  missingRequired: string[];
  /** Documents currently in the packet that should not be kept. */
  removeFromPacket: string[];
  mustHold: boolean;
  policyConflict: boolean;
  message: string;
}

export const DOCUMENT_LABELS: Record<keyof DocumentChecklist, string> = {
  preAuthorizationForm: "Pre-Authorisation Request Form (patient and treating doctor signed)",
  insurerCard: "TPA ID card / insurer e-card",
  identityProof: "Aadhaar photo ID + e-KYC (or PAN / voter ID)",
  policyCopy: "Policy copy (sum insured and room-rent limit)",
  admissionAdvice: "Doctor's admission advice with provisional diagnosis",
  investigationReports: "Investigation reports on hospital letterhead, dated",
  investigationReportsOnLetterheadAndDated: "Reports are on hospital letterhead and dated",
  investigationReportsMatchDiagnosis: "Laboratory reports match the diagnosis",
  cbcAttached: "CBC report attached",
  fitnessCertificate: "Physician fitness certificate",
  fitnessCertificateAgeDays: "Fitness certificate age (days)",
  signedSurgicalConsent: "Signed surgical consent form",
  itemisedEstimate: "Itemised cost estimate",
  mlcFir: "MLC / FIR copy",
};

function packageNameMatchesProcedure(admission: AdmissionCase): boolean {
  return (
    admission.packageName.trim().toLowerCase() === admission.procedure.trim().toLowerCase()
  );
}

function packageCodeMatchesProcedure(admission: AdmissionCase): boolean {
  const procedure = procedureByName(admission.procedure);
  return Boolean(procedure && admission.packageCode.trim() === procedure.packageCode);
}

export function assessPacket(admission: AdmissionCase): PacketAssessment {
  const missingRequired: string[] = [];
  const removeFromPacket: string[] = [];
  const payerId: PayerId = admission.payerId;
  const documents = admission.documents;

  if (!documents.preAuthorizationForm) {
    missingRequired.push(DOCUMENT_LABELS.preAuthorizationForm);
  }
  if (!documents.insurerCard) {
    missingRequired.push(
      payerId === "jan-raksha-yojana"
        ? "Jan Raksha Ayushman-style e-card"
        : DOCUMENT_LABELS.insurerCard,
    );
  }
  if (documents.identityProof === "missing") {
    missingRequired.push(DOCUMENT_LABELS.identityProof);
  }
  if (payerId === "jan-raksha-yojana" && documents.identityProof !== "aadhaar") {
    missingRequired.push("Aadhaar / e-KYC verified for Jan Raksha");
  }
  if (!documents.policyCopy) {
    missingRequired.push(DOCUMENT_LABELS.policyCopy);
  }
  if (!documents.admissionAdvice) {
    missingRequired.push(DOCUMENT_LABELS.admissionAdvice);
  }
  if (admission.accidentCase && !documents.mlcFir) {
    missingRequired.push(DOCUMENT_LABELS.mlcFir);
  }

  switch (payerId) {
    case "bharat-arogya":
      if (!documents.investigationReports) {
        missingRequired.push(DOCUMENT_LABELS.investigationReports);
      } else if (!documents.investigationReportsOnLetterheadAndDated) {
        missingRequired.push("Investigation reports with date on hospital letterhead");
      }
      if (!packageNameMatchesProcedure(admission)) {
        missingRequired.push(`Exact package name: ${admission.procedure}`);
      }
      break;
    case "suraksha-general":
      if (!documents.investigationReports) {
        missingRequired.push(DOCUMENT_LABELS.investigationReports);
      }
      if (documents.investigationReports && !documents.investigationReportsMatchDiagnosis) {
        missingRequired.push("Matching laboratory reports");
      }
      if (!documents.fitnessCertificate) {
        missingRequired.push(DOCUMENT_LABELS.fitnessCertificate);
      } else if (documents.fitnessCertificateAgeDays > 14) {
        missingRequired.push("Fitness certificate dated within 14 days");
      }
      break;
    case "navjeevan-health-tpa":
      if (!documents.signedSurgicalConsent) {
        missingRequired.push(DOCUMENT_LABELS.signedSurgicalConsent);
      }
      if (!documents.itemisedEstimate) {
        missingRequired.push(DOCUMENT_LABELS.itemisedEstimate);
      }
      break;
    case "jan-raksha-yojana":
      if (!packageCodeMatchesProcedure(admission)) {
        missingRequired.push(`Jan Raksha package code for ${admission.procedure}`);
      }
      if (!documents.cbcAttached) {
        missingRequired.push("CBC report");
      }
      break;
  }

  const mustHold = missingRequired.length > 0 || removeFromPacket.length > 0;
  return {
    missingRequired,
    removeFromPacket,
    mustHold,
    policyConflict: mustHold,
    message: buildReviewMessage(admission, missingRequired, removeFromPacket, mustHold),
  };
}

function buildReviewMessage(
  admission: AdmissionCase,
  missingRequired: string[],
  removeFromPacket: string[],
  mustHold: boolean,
): string {
  const procedure = admission.procedure.trim() || "this procedure";
  const lines = [
    mustHold
      ? `Hold. Do not send this ${procedure} file yet.`
      : `Send. The ${procedure} packet meets this insurer's checklist.`,
    missingRequired.length > 0
      ? `Missing required documents: ${missingRequired.join("; ")}.`
      : "Missing required documents: none.",
    removeFromPacket.length > 0
      ? `Do not keep in this packet: ${removeFromPacket.join("; ")}.`
      : "Do not keep in this packet: none.",
  ];
  return lines.join(" ");
}
