import type { Payer, PayerId } from "./types";

export const PAYERS: Payer[] = [
  {
    id: "bharat-arogya",
    bankId: "payerline-bharat-arogya",
    name: "Bharat Arogya Insurance",
    shortName: "Bharat Arogya",
    deskCode: "BAI-04",
    posture: "Strict on investigation reports dated on hospital letterhead and the exact package name.",
    writtenPolicy: [
      "Submit relevant investigation reports dated on hospital letterhead.",
      "Use the exact name of the planned procedure as the package name.",
      "Include the signed pre-authorisation and supporting identity documents.",
    ],
  },
  {
    id: "suraksha-general",
    bankId: "payerline-suraksha-general",
    name: "Suraksha General Insurance",
    shortName: "Suraksha General",
    deskCode: "SGI-17",
    posture: "Needs matching laboratory reports and a physician fitness certificate issued within 14 days.",
    writtenPolicy: [
      "Include relevant, matching investigation reports.",
      "Attach a physician fitness certificate dated within 14 days of admission.",
      "Include the signed pre-authorisation and supporting identity documents.",
    ],
  },
  {
    id: "navjeevan-health-tpa",
    bankId: "payerline-navjeevan-health-tpa",
    name: "Navjeevan Health TPA",
    shortName: "Navjeevan",
    deskCode: "NHT-22",
    posture: "Looks for signed surgical consent and a fully itemised estimate, not a lump sum.",
    writtenPolicy: [
      "Attach surgical consent signed by the patient.",
      "Provide an itemised estimate of the planned admission.",
      "Include the signed pre-authorisation and supporting identity documents.",
    ],
  },
  {
    id: "jan-raksha-yojana",
    bankId: "payerline-jan-raksha",
    name: "Jan Raksha Yojana",
    shortName: "Jan Raksha",
    deskCode: "JRY-09",
    posture: "Scheme-style checks focus on Aadhaar/e-KYC, the Ayushman-style card, package code, and CBC.",
    writtenPolicy: [
      "Verify Aadhaar/e-KYC and attach the Jan Raksha e-card.",
      "Use the package code that matches the procedure.",
      "Attach a CBC report with the required admission papers.",
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
