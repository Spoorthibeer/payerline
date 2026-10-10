import { HOSPITALS } from "@shared/catalog";
import type { DocumentChecklist, ExtractedFields, HospitalId, IdentityProof, PayerId } from "@shared/types";
import { groqConfig } from "./env";

const TOOL = {
  type: "function",
  function: {
    name: "extract_admission",
    description: "Extract structured cashless admission fields from a hospital pre-authorisation note.",
    parameters: {
      type: "object",
      properties: {
        diagnosis: { type: "string" },
        procedure: { type: "string" },
        hospitalId: { type: "string", enum: HOSPITALS.map((hospital) => hospital.id) },
        payerId: {
          type: "string",
          enum: ["bharat-arogya", "suraksha-general", "navjeevan-health-tpa", "jan-raksha-yojana"],
        },
        packageName: { type: "string" },
        packageCode: { type: "string" },
        accidentCase: { type: "boolean" },
        documents: {
          type: "object",
          properties: {
            preAuthorizationForm: { type: "boolean" },
            insurerCard: { type: "boolean" },
            identityProof: { type: "string", enum: ["aadhaar", "pan", "voter-id", "missing"] },
            policyCopy: { type: "boolean" },
            admissionAdvice: { type: "boolean" },
            investigationReports: { type: "boolean" },
            investigationReportsOnLetterheadAndDated: { type: "boolean" },
            investigationReportsMatchDiagnosis: { type: "boolean" },
            cbcAttached: { type: "boolean" },
            fitnessCertificate: { type: "boolean" },
            fitnessCertificateAgeDays: { type: "number" },
            signedSurgicalConsent: { type: "boolean" },
            itemisedEstimate: { type: "boolean" },
            mlcFir: { type: "boolean" },
          },
          required: [
            "preAuthorizationForm",
            "insurerCard",
            "identityProof",
            "policyCopy",
            "admissionAdvice",
            "investigationReports",
            "investigationReportsOnLetterheadAndDated",
            "investigationReportsMatchDiagnosis",
            "cbcAttached",
            "fitnessCertificate",
            "fitnessCertificateAgeDays",
            "signedSurgicalConsent",
            "itemisedEstimate",
            "mlcFir",
          ],
        },
      },
      required: ["diagnosis", "procedure", "hospitalId", "payerId", "packageName", "packageCode", "accidentCase", "documents"],
    },
  },
};

interface ChatMessage {
  role: string;
  content?: string | null;
  tool_calls?: Array<{
    id: string;
    type?: string;
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

export async function extractAdmission(note: string): Promise<ExtractedFields> {
  const { apiKey, model } = groqConfig();
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "Extract a cashless pre-authorisation file for one of these fictional hospitals, insurers, and procedures. Call extract_admission exactly once. Bharat Arogya Insurance is bharat-arogya and checks dated reports on hospital letterhead and the exact package name. Suraksha General Insurance is suraksha-general and checks matching labs and a fitness certificate no older than 14 days. Navjeevan Health TPA is navjeevan-health-tpa and checks signed consent and an itemised estimate. Jan Raksha Yojana is jan-raksha-yojana and checks Aadhaar/e-KYC, its scheme e-card, package code, and CBC. If a document is not mentioned, mark it absent. Set accidentCase only when the note says this is an accident case; MLC/FIR is applicable only then.",
    },
    { role: "user", content: note },
  ];

  let lastProblem = "Groq returned no tool call.";
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages,
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "extract_admission" } },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Groq request failed (${response.status}): ${detail.slice(0, 400)}`);
    }

    const body = (await response.json()) as {
      choices?: Array<{ message?: ChatMessage }>;
    };
    const message = body.choices?.[0]?.message;
    if (!message) {
      lastProblem = "Groq returned an empty choice.";
      messages.push({ role: "user", content: "Call extract_admission. The last response had no message." });
      continue;
    }

    const call = message.tool_calls?.[0];
    if (!call || call.function.name !== "extract_admission") {
      lastProblem = "The model did not call extract_admission.";
      messages.push(message);
      messages.push({
        role: "user",
        content: "That reply was not a tool call. Call extract_admission with JSON arguments only.",
      });
      continue;
    }

    try {
      const parsed = JSON.parse(call.function.arguments) as Partial<ExtractedFields>;
      return normalizeExtract(parsed);
    } catch {
      lastProblem = "extract_admission arguments were not valid JSON.";
      messages.push(message);
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: "arguments were not valid JSON. Call extract_admission again with a JSON object.",
      });
    }
  }

  throw new Error(`${lastProblem} Retried 3 times.`);
}

function normalizeExtract(parsed: Partial<ExtractedFields>): ExtractedFields {
  const knownPayers: PayerId[] = [
    "bharat-arogya",
    "suraksha-general",
    "navjeevan-health-tpa",
    "jan-raksha-yojana",
  ];
  const payerId: PayerId = knownPayers.includes(parsed.payerId as PayerId)
    ? (parsed.payerId as PayerId)
    : "bharat-arogya";
  const knownHospitals = HOSPITALS.map((hospital) => hospital.id);
  const hospitalId: HospitalId = knownHospitals.includes(parsed.hospitalId as HospitalId)
    ? (parsed.hospitalId as HospitalId)
    : HOSPITALS[0].id;
  const sourceDocuments = parsed.documents as Partial<DocumentChecklist> | undefined;
  const identityProof: IdentityProof =
    sourceDocuments?.identityProof === "aadhaar" ||
    sourceDocuments?.identityProof === "pan" ||
    sourceDocuments?.identityProof === "voter-id" ||
    sourceDocuments?.identityProof === "missing"
      ? sourceDocuments.identityProof
      : "missing";
  return {
    diagnosis: text(parsed.diagnosis, "Acute calculus cholecystitis"),
    procedure: text(parsed.procedure, "Laparoscopic cholecystectomy"),
    hospitalId,
    payerId,
    packageName: text(parsed.packageName, "Laparoscopic cholecystectomy"),
    packageCode: text(parsed.packageCode, ""),
    accidentCase: Boolean(parsed.accidentCase),
    documents: {
      preAuthorizationForm: Boolean(sourceDocuments?.preAuthorizationForm),
      insurerCard: Boolean(sourceDocuments?.insurerCard),
      identityProof,
      policyCopy: Boolean(sourceDocuments?.policyCopy),
      admissionAdvice: Boolean(sourceDocuments?.admissionAdvice),
      investigationReports: Boolean(sourceDocuments?.investigationReports),
      investigationReportsOnLetterheadAndDated: Boolean(
        sourceDocuments?.investigationReportsOnLetterheadAndDated,
      ),
      investigationReportsMatchDiagnosis: Boolean(
        sourceDocuments?.investigationReportsMatchDiagnosis,
      ),
      cbcAttached: Boolean(sourceDocuments?.cbcAttached),
      fitnessCertificate: Boolean(sourceDocuments?.fitnessCertificate),
      fitnessCertificateAgeDays: Number.isFinite(sourceDocuments?.fitnessCertificateAgeDays)
        ? Number(sourceDocuments?.fitnessCertificateAgeDays)
        : 0,
      signedSurgicalConsent: Boolean(sourceDocuments?.signedSurgicalConsent),
      itemisedEstimate: Boolean(sourceDocuments?.itemisedEstimate),
      mlcFir: Boolean(sourceDocuments?.mlcFir),
    },
  };
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
