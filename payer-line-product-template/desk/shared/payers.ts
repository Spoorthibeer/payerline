import type { Payer, PayerId } from "./types";

export const PAYERS: Payer[] = [
  {
    id: "meridian",
    bankId: "payerline-meridian",
    name: "Meridian Health Assurance",
    shortName: "Meridian",
    deskCode: "MHA-04",
    posture: "Written rules look permissive. Past denials turn on letterhead dates and the exact package name.",
    writtenPolicy: [
      "An ultrasound report is required for laparoscopic cholecystectomy.",
      "Any clinically reasonable package name is acceptable.",
      "Additional laboratory reports are welcome and do not delay approval.",
    ],
  },
  {
    id: "northline",
    bankId: "payerline-northline",
    name: "Northline General Insurance",
    shortName: "Northline",
    deskCode: "NGI-17",
    posture: "The checklist is short. Clearance actually depends on a fresh laboratory panel and a recent fitness note.",
    writtenPolicy: [
      "Submit the standard surgical package with supporting clinical notes.",
      "Imaging may be attached when available. Letterhead format is not specified.",
      "Pre-operative investigations follow the hospital’s own protocol.",
    ],
  },
  {
    id: "harbour",
    bankId: "payerline-harbour",
    name: "Harbour Indemnity",
    shortName: "Harbour",
    deskCode: "HBI-22",
    posture: "The written policy stops at clinical notes. Past denials turn on an unsigned consent and a lump-sum estimate.",
    writtenPolicy: [
      "Clinical notes and an ultrasound are sufficient for laparoscopic cholecystectomy.",
      "Consent and the estimate follow the hospital's own file.",
      "Package wording is not specified.",
    ],
  },
  {
    id: "sable",
    bankId: "payerline-sable",
    name: "Sable Mutual",
    shortName: "Sable",
    deskCode: "SMU-09",
    posture: "The written policy treats identity as the hospital's job. Clearance actually needs a photo, the policy card, and a CBC.",
    writtenPolicy: [
      "Submit the surgical package with clinical notes.",
      "Identity is checked by the hospital at admission.",
      "Investigations follow the hospital protocol.",
    ],
  },
];

export function payerById(id: PayerId): Payer {
  const payer = PAYERS.find((item) => item.id === id);
  if (!payer) {
    throw new Error(`Unknown payer: ${id}`);
  }
  return payer;
}
