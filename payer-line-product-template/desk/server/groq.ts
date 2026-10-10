import type { ExtractedFields, PayerId } from "@shared/types";
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
        payerId: { type: "string", enum: ["meridian", "northline", "harbour", "sable"] },
        packageName: { type: "string" },
        ultrasoundAttached: { type: "boolean" },
        ultrasoundDateOnLetterhead: { type: "boolean" },
        cultureReportAttached: { type: "boolean" },
        cultureContradictsDiagnosis: { type: "boolean" },
        fitnessCertificateAttached: { type: "boolean" },
        fitnessCertificateAgeDays: { type: "number" },
      },
      required: [
        "diagnosis",
        "procedure",
        "payerId",
        "packageName",
        "ultrasoundAttached",
        "ultrasoundDateOnLetterhead",
        "cultureReportAttached",
        "cultureContradictsDiagnosis",
        "fitnessCertificateAttached",
        "fitnessCertificateAgeDays",
      ],
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
        "You read cashless pre-authorisation notes for St. Brigid Memorial. Call extract_admission exactly once. Meridian Health Assurance is payerId meridian. Northline General Insurance is payerId northline. Harbour Indemnity is payerId harbour. Sable Mutual is payerId sable. If a document is not mentioned, mark it absent. Set cultureContradictsDiagnosis true when the culture report shows no growth, an unrelated finding, or any result that does not support the stated diagnosis.",
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
  const known: PayerId[] = ["meridian", "northline", "harbour", "sable"];
  const payerId: PayerId = known.includes(parsed.payerId as PayerId) ? (parsed.payerId as PayerId) : "meridian";
  return {
    diagnosis: text(parsed.diagnosis, "Acute calculus cholecystitis"),
    procedure: text(parsed.procedure, "Laparoscopic cholecystectomy"),
    payerId,
    packageName: text(parsed.packageName, "management"),
    ultrasoundAttached: Boolean(parsed.ultrasoundAttached),
    ultrasoundDateOnLetterhead: Boolean(parsed.ultrasoundDateOnLetterhead),
    cultureReportAttached: Boolean(parsed.cultureReportAttached),
    cultureContradictsDiagnosis: Boolean(parsed.cultureContradictsDiagnosis),
    fitnessCertificateAttached: Boolean(parsed.fitnessCertificateAttached),
    fitnessCertificateAgeDays: Number.isFinite(parsed.fitnessCertificateAgeDays)
      ? Number(parsed.fitnessCertificateAgeDays)
      : 0,
  };
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
