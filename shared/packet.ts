import type { AdmissionCase, PayerId } from "./types";

export interface PacketAssessment {
  /** Documents missing or wrong in today's selected packet. */
  missingRequired: string[];
  /** Documents currently in the packet that should not be kept. */
  removeFromPacket: string[];
  mustHold: boolean;
  policyConflict: boolean;
  /** Fixed review text — same packet always yields the same message. */
  message: string;
}

function packageMatchesProcedure(admission: AdmissionCase): boolean {
  const procedure = admission.procedure.trim().toLowerCase();
  const packageName = admission.packageName.trim().toLowerCase();
  if (!procedure || !packageName) return false;
  return packageName === procedure;
}

/**
 * Stable checklist from today's selected fields and this insurer's outcome habits.
 * Same packet + same insurer → same missing list, same remove list, same message.
 */
export function assessPacket(admission: AdmissionCase): PacketAssessment {
  const missingRequired: string[] = [];
  const removeFromPacket: string[] = [];
  const payerId: PayerId = admission.payerId;
  const procedure = admission.procedure.trim() || "the procedure";

  switch (payerId) {
    case "meridian":
      if (!packageMatchesProcedure(admission)) {
        missingRequired.push(`Package name: ${procedure}`);
      }
      if (!admission.ultrasoundDateOnLetterhead) {
        missingRequired.push("Ultrasound on letterhead");
      }
      if (admission.cultureReportAttached && admission.cultureContradictsDiagnosis) {
        removeFromPacket.push("Conflicting culture report");
      }
      break;
    case "northline":
      if (!admission.cbcAttached) missingRequired.push("CBC");
      if (!admission.cultureReportAttached) {
        missingRequired.push("Culture report");
      } else if (admission.cultureContradictsDiagnosis) {
        missingRequired.push("Culture report");
        removeFromPacket.push("Conflicting culture report");
      }
      if (!admission.fitnessCertificateAttached) {
        missingRequired.push("Fitness certificate");
      } else if (admission.fitnessCertificateAgeDays > 14) {
        missingRequired.push("Fitness certificate (≤14 days)");
      }
      break;
    case "harbour":
      if (!admission.consentAttached) missingRequired.push("Surgical consent");
      if (!admission.itemisedEstimateAttached) missingRequired.push("Itemised estimate");
      break;
    case "sable":
      if (!admission.photoIdAttached) missingRequired.push("Photo identity");
      if (!admission.policyCardAttached) missingRequired.push("Policy e-card");
      if (!admission.cbcAttached) missingRequired.push("CBC");
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
  const who = admission.patientName.trim() || "this patient";
  const procedure = admission.procedure.trim() || "this procedure";
  const lines: string[] = [];

  if (mustHold) {
    lines.push(`Hold. Do not send ${who}'s ${procedure} file yet.`);
  } else {
    lines.push(`Send. ${who}'s ${procedure} packet matches what this insurer has cleared before.`);
  }

  if (missingRequired.length > 0) {
    lines.push(`Missing required documents: ${missingRequired.join("; ")}.`);
  } else {
    lines.push("Missing required documents: none.");
  }

  if (removeFromPacket.length > 0) {
    lines.push(`Do not keep in this packet: ${removeFromPacket.join("; ")}.`);
  } else {
    lines.push("Do not keep in this packet: none.");
  }

  return lines.join(" ");
}
