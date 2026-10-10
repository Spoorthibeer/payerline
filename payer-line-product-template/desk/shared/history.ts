import { PROCEDURES } from "./catalog";
import { PAYERS } from "./payers";
import type { PayerId } from "./types";

interface HistoryDocument {
  payerId: PayerId;
  documentId: string;
  timestamp: string;
  context: string;
  tags: string[];
  content: string;
}

type OutcomeScenario = {
  date: string;
  outcome: "approved" | "queried" | "denied";
  requested: number;
  approved?: number;
  documentFacts: string;
  reason: string;
};

const SCENARIOS: Record<PayerId, OutcomeScenario[]> = {
  "bharat-arogya": [
    {
      date: "2025-11-12",
      outcome: "denied",
      requested: 78000,
      documentFacts: "investigation reports lacked hospital letterhead date; package name did not match the procedure",
      reason: "Denied for missing dated hospital letterhead and package-name mismatch.",
    },
    {
      date: "2026-01-18",
      outcome: "queried",
      requested: 82500,
      documentFacts: "ultrasound was dated only on the imaging printout; exact procedure package name was present",
      reason: "Queried for the ultrasound date to be printed on hospital letterhead.",
    },
    {
      date: "2026-03-09",
      outcome: "approved",
      requested: 91000,
      approved: 87500,
      documentFacts: "relevant investigation reports carried hospital letterhead dates; package name exactly matched the procedure",
      reason: "Approved after the exact procedure package name and dated hospital-letterhead reports were attached.",
    },
    {
      date: "2026-05-21",
      outcome: "approved",
      requested: 96500,
      approved: 94000,
      documentFacts: "ultrasound and blood reports were dated on hospital letterhead; package name exactly matched",
      reason: "Approved on first submission; exact package wording and dated letterhead reports were accepted.",
    },
  ],
  "suraksha-general": [
    {
      date: "2025-10-04",
      outcome: "denied",
      requested: 72000,
      documentFacts: "matching laboratory reports were missing; fitness certificate was 19 days old",
      reason: "Denied because the reports did not match the diagnosis and the fitness certificate exceeded 14 days.",
    },
    {
      date: "2026-01-07",
      outcome: "queried",
      requested: 84500,
      documentFacts: "CBC was present but culture report was absent; fitness certificate was 6 days old",
      reason: "Queried for the missing matching culture report; the recent fitness certificate was accepted.",
    },
    {
      date: "2026-03-26",
      outcome: "approved",
      requested: 88500,
      approved: 86000,
      documentFacts: "CBC and culture matched the diagnosis; fitness certificate was 4 days old",
      reason: "Approved after matching lab reports and a fitness certificate within 14 days were confirmed.",
    },
    {
      date: "2026-06-14",
      outcome: "approved",
      requested: 104000,
      approved: 101500,
      documentFacts: "dated CBC and matching reports attached; fitness certificate was 2 days old",
      reason: "Approved on first review with matching reports and a fresh physician fitness certificate.",
    },
  ],
  "navjeevan-health-tpa": [
    {
      date: "2025-10-08",
      outcome: "denied",
      requested: 69000,
      documentFacts: "surgical consent was unsigned; estimate was a single lump sum",
      reason: "Denied for unsigned surgical consent and a non-itemised estimate.",
    },
    {
      date: "2026-01-19",
      outcome: "queried",
      requested: 79500,
      documentFacts: "consent was signed; estimate omitted room and consumable line items",
      reason: "Queried for a complete itemised estimate; signed consent was accepted.",
    },
    {
      date: "2026-03-18",
      outcome: "approved",
      requested: 91500,
      approved: 89000,
      documentFacts: "patient-signed surgical consent and itemised estimate attached",
      reason: "Approved after signed consent and item-by-item charges were supplied.",
    },
    {
      date: "2026-06-29",
      outcome: "approved",
      requested: 118000,
      approved: 112000,
      documentFacts: "signed consent and estimate itemising surgeon, theatre, implants, room, and medicines",
      reason: "Approved on first review; the estimate separated procedure and admission charges.",
    },
  ],
  "jan-raksha-yojana": [
    {
      date: "2025-12-11",
      outcome: "denied",
      requested: 54000,
      documentFacts: "Aadhaar/e-KYC was not verified; Jan Raksha e-card and CBC were absent",
      reason: "Denied because e-KYC and the scheme e-card were missing from the packet.",
    },
    {
      date: "2026-02-04",
      outcome: "queried",
      requested: 62500,
      documentFacts: "Aadhaar/e-KYC and e-card were present; CBC was missing",
      reason: "Queried for CBC and confirmation of the procedure-specific package code.",
    },
    {
      date: "2026-04-16",
      outcome: "approved",
      requested: 68500,
      approved: 68500,
      documentFacts: "Aadhaar/e-KYC, Jan Raksha e-card, matching package code, and CBC attached",
      reason: "Approved within the scheme package limit after all eligibility documents were verified.",
    },
    {
      date: "2026-07-08",
      outcome: "approved",
      requested: 73500,
      approved: 71000,
      documentFacts: "Aadhaar/e-KYC verified; active scheme e-card, matching package code, and CBC attached",
      reason: "Approved after the package code and CBC matched the procedure and scheme record.",
    },
  ],
};

export const HISTORY: HistoryDocument[] = PAYERS.flatMap((payer) =>
  PROCEDURES.flatMap((procedure, procedureIndex) =>
    SCENARIOS[payer.id].map((scenario, scenarioIndex) => {
      const date = scenario.date;
      const request = amountForProcedure(scenario.requested, procedureIndex);
      const approved = scenario.approved
        ? amountForProcedure(scenario.approved, procedureIndex)
        : undefined;
      const outcomeText =
        scenario.outcome === "approved" && approved !== undefined
          ? `APPROVED ₹${approved.toLocaleString("en-IN")} of ₹${request.toLocaleString("en-IN")}`
          : `${scenario.outcome.toUpperCase()} on a request of ₹${request.toLocaleString("en-IN")}`;

      return {
        payerId: payer.id,
        documentId: `${payer.id}-${procedure.tag.slice("procedure:".length)}-${date}-${scenarioIndex + 1}`,
        timestamp: `${date}T10:15:00Z`,
        context: `simulated ${scenario.outcome} outcome for ${payer.name}, ${procedure.name}`,
        tags: [procedure.tag, `outcome:${scenario.outcome}`, "source:seed"],
        content: [
          `On ${date}, ${payer.name} reviewed a cashless ${procedure.name} request.`,
          `Document facts: ${scenario.documentFacts}.`,
          `Outcome: ${outcomeText}.`,
          `Reason: ${scenario.reason}`,
        ].join("\n"),
      };
    }),
  ),
);

function amountForProcedure(base: number, procedureIndex: number): number {
  return Math.round((base * (1 + procedureIndex * 0.19)) / 500) * 500;
}

export const DEFAULT_NOTE = `Sri Venkateswara Multispeciality Hospital, Hyderabad
Cashless pre-authorisation note

Procedure: Laparoscopic cholecystectomy
Insurer: Bharat Arogya Insurance
Package name on the draft form: management

Documents in the packet:
- Pre-Authorisation Request Form is signed by the patient and treating doctor.
- Insurer e-card, Aadhaar/e-KYC, policy copy, and doctor's admission advice are attached.
- Ultrasound report is attached. The scan date is on the radiology printout, not hospital letterhead.
- The package name does not match the procedure.

Advice only. A person still sends the file.`;
