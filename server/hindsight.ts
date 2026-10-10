import { HindsightClient, HindsightError } from "@vectorize-io/hindsight-client";
import type { EvidenceItem, LedgerEntry, PayerId } from "@shared/types";
import { HISTORY } from "@shared/history";
import { payerById, PAYERS } from "@shared/payers";
import { hindsightConfig } from "./env";

const DECISION_SCHEMA = {
  type: "object",
  properties: {
    decision: { type: "string", enum: ["hold", "send"] },
    confidence: { type: "string", enum: ["thin", "moderate", "strong"] },
    policy_conflict: { type: "boolean" },
    summary: { type: "string" },
    fixes: { type: "array", items: { type: "string" } },
    do_not_add: { type: "array", items: { type: "string" } },
    evidence: { type: "array", items: { type: "string" } },
  },
  required: ["decision", "confidence", "policy_conflict", "summary", "fixes", "do_not_add", "evidence"],
};

const DIRECTIVES = [
  {
    name: "Clinical boundary",
    content:
      "Never recommend, change, or question the clinical treatment. The procedure is already decided by the surgeon. You only judge whether the cashless packet should be sent.",
  },
  {
    name: "Evidence threshold",
    content:
      "Do not invent a payer rule from a single case. If fewer than two past outcomes agree, set confidence to thin and say the evidence is thin.",
  },
  {
    name: "Policy conflict",
    content:
      "When past denials or queries conflict with the written policy, follow the past outcomes. Set policy_conflict to true and explain the conflict in the summary.",
  },
  {
    name: "One insurer",
    content:
      "This memory bank belongs to one insurer. Never apply another insurer's document habits, package names, or denial reasons.",
  },
  {
    name: "Cite the file",
    content:
      "Evidence must name the date and what the insurer actually did: approved, queried, or denied, and why. fixes and do_not_add must be short document names only, never long sentences.",
  },
  {
    name: "Disagreement",
    content:
      "If two past cases disagree, show both in the evidence and do not collapse them into one certain rule. Lower the confidence.",
  },
  {
    name: "Documents that hurt",
    content:
      "If a document previously caused a query or a denial, list it in do_not_add. Do not ask the desk to attach it again.",
  },
];

let client: HindsightClient | null = null;

export function hindsight(): HindsightClient {
  if (!client) {
    const config = hindsightConfig();
    client = new HindsightClient({ baseUrl: config.baseUrl, apiKey: config.apiKey });
  }
  return client;
}

export function decisionSchema(): Record<string, unknown> {
  return DECISION_SCHEMA;
}

function bankMission(payerName: string): string {
  return `You are the cashless pre-authorisation memory for ${payerName} at St. Brigid Memorial Hospital. You stop files this insurer has rejected before. You speak in formal hospital English. You cite dates and outcomes. You never choose treatment.`;
}

export async function provisionBanks(): Promise<void> {
  const api = hindsight();
  for (const payer of PAYERS) {
    try {
      await api.createBank(payer.bankId, {
        name: payer.name,
        reflectMission: bankMission(payer.name),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/already exists|409|conflict/i.test(message)) throw error;
    }
    await api.updateBankConfig(payer.bankId, {
      reflectMission: bankMission(payer.name),
      retainMission:
        "Extract cashless outcomes, denial and query reasons, document defects, package names, and the change that later won approval. Ignore bedside manner, greetings, and scheduling chatter.",
      retainExtractionMode: "verbose",
      observationsMission:
        "Observations are durable rules about what this insurer actually approves or rejects. Keep the document defect, the package name, and the outcome. Revise a rule when a newer outcome contradicts it. Leave out one-off patient details that do not change the next file.",
      dispositionSkepticism: 5,
      dispositionLiteralism: 5,
      dispositionEmpathy: 2,
      enableObservations: true,
    });

    const existing = await api.listDirectives(payer.bankId);
    const names = new Set(existing.items.map((item) => item.name));
    for (const directive of DIRECTIVES) {
      if (!names.has(directive.name)) {
        await api.createDirective(payer.bankId, directive.name, directive.content, { priority: 10 });
      }
    }
  }
}

export async function retainHistory(): Promise<number> {
  const api = hindsight();
  for (const item of HISTORY) {
    const payer = payerById(item.payerId);
    const response = await api.retain(payer.bankId, item.content, {
      timestamp: item.timestamp,
      context: item.context,
      documentId: item.documentId,
      tags: item.tags,
      updateMode: "replace",
    });
    if (response.async && response.operation_id) {
      await waitForOperation(payer.bankId, response.operation_id);
    }
  }
  return HISTORY.length;
}

export async function retainOutcome(input: {
  payerId: PayerId;
  content: string;
  tags: string[];
  documentId: string;
}): Promise<void> {
  const payer = payerById(input.payerId);
  const response = await hindsight().retain(payer.bankId, input.content, {
    timestamp: new Date().toISOString(),
    context: `live cashless outcome recorded at the St. Brigid desk for ${payer.name}`,
    documentId: input.documentId,
    tags: input.tags,
    updateMode: "replace",
  });
  if (response.async && response.operation_id) {
    await waitForOperation(payer.bankId, response.operation_id);
  }
}

export async function recallCase(payerId: PayerId, query: string, procedure = ""): Promise<EvidenceItem[]> {
  const payer = payerById(payerId);
  const result = await hindsight().recall(payer.bankId, query, {
    budget: "mid",
    maxTokens: 1800,
    tags: [procedureTag(procedure)],
    tagsMatch: "any",
  });
  return result.results.map((item) => ({
    id: item.id,
    text: item.text,
    type: item.type ?? undefined,
    occurred: item.occurred_start ?? undefined,
    context: item.context ?? undefined,
  }));
}

export async function reflectCase(
  payerId: PayerId,
  query: string,
  procedure = "",
): Promise<{
  narrative: string;
  structured: Record<string, unknown> | null;
  basedOn: EvidenceItem[];
  structuredError?: string;
}> {
  const payer = payerById(payerId);
  const result = await hindsight().reflect(payer.bankId, query, {
    budget: "mid",
    responseSchema: decisionSchema(),
    includeFacts: true,
    tags: [procedureTag(procedure)],
    tagsMatch: "any",
  });
  const memories = result.based_on?.memories ?? [];
  return {
    narrative: result.text,
    structured: result.structured_output ?? null,
    structuredError: result.structured_output_error ?? undefined,
    basedOn: memories.map((item, index) => ({
      id: item.id ?? `cited-${index}`,
      text: item.text,
      type: item.type ?? undefined,
      occurred: item.occurred_start ?? undefined,
      context: item.context ?? undefined,
    })),
  };
}

export async function loadLedger(payerId: PayerId): Promise<LedgerEntry[]> {
  const payer = payerById(payerId);
  const api = hindsight();
  const [observations, recent] = await Promise.all([
    api.listMemories(payer.bankId, { type: "observation", limit: 8 }),
    api.listMemories(payer.bankId, { limit: 20 }),
  ]);
  const seen = new Set<string>();
  const entries: LedgerEntry[] = [];
  for (const item of [...observations.items, ...recent.items]) {
    if (!item.text || seen.has(item.id)) continue;
    seen.add(item.id);
    entries.push({
      id: item.id,
      text: item.text,
      type: item.fact_type ?? undefined,
      occurred: item.date || undefined,
      context: item.context,
    });
  }
  return entries;
}

/** Recent approvals, queries, and denials for this procedure (package name should match it). */
export async function loadRecentOutcomes(
  payerId: PayerId,
  procedure: string,
  packageName = "",
  limit = 6,
): Promise<EvidenceItem[]> {
  const entries = await loadLedger(payerId);
  const procedureNeedle = procedure.trim().toLowerCase();
  const packageNeedle = packageName.trim().toLowerCase();
  const matched = entries
    .filter((entry) => matchesProcedureOutcome(entry, procedureNeedle, packageNeedle))
    .sort((a, b) => outcomeDate(b.occurred).localeCompare(outcomeDate(a.occurred)))
    .slice(0, limit)
    .map((entry) => ({
      id: entry.id,
      text: entry.text,
      type: outcomeLabel(entry.text) || entry.type || "outcome",
      occurred: entry.occurred,
      context: entry.context,
    }));
  return matched;
}

export function procedureTag(procedure: string): string {
  const slug = procedure
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug || slug.includes("cholecystectomy")) return "procedure:cholecystectomy";
  return `procedure:${slug}`;
}

function matchesProcedureOutcome(
  entry: LedgerEntry,
  procedureNeedle: string,
  packageNeedle: string,
): boolean {
  const text = entry.text.toLowerCase();
  if (/published cashless policy/.test(text)) return false;
  if (!/(denied|denial|approved|approval|queried|query|outcome)/.test(text)) return false;
  if (!procedureNeedle) return true;
  if (text.includes(procedureNeedle)) return true;
  // Package should match the procedure; still accept memories that name either form.
  if (packageNeedle && packageNeedle === procedureNeedle && text.includes(packageNeedle)) return true;
  if (procedureNeedle.includes("cholecystectomy") && text.includes("cholecystectomy")) return true;
  return false;
}

function outcomeLabel(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (/\bdenied\b|\bdenial\b/.test(lower)) return "denied";
  if (/\bqueried\b|\bquery\b/.test(lower)) return "queried";
  if (/\bapproved\b|\bapproval\b/.test(lower)) return "approved";
  return undefined;
}

function outcomeDate(value?: string): string {
  if (!value) return "";
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : value;
}

async function waitForOperation(bankId: string, operationId: string): Promise<void> {
  const { baseUrl, apiKey } = hindsightConfig();
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const response = await fetch(
      `${baseUrl.replace(/\/$/, "")}/v1/default/banks/${bankId}/operations/${operationId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    if (response.ok) {
      const body = (await response.json()) as { status?: string; state?: string };
      const status = (body.status ?? body.state ?? "").toLowerCase();
      if (["completed", "complete", "succeeded", "success", "done"].includes(status)) return;
      if (["failed", "error", "cancelled"].includes(status)) {
        throw new Error(`Hindsight retain failed for ${bankId}: ${status}`);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error(`Hindsight retain for ${bankId} did not finish in time.`);
}

export function explainHindsightError(error: unknown): { status: number; message: string } | null {
  if (error instanceof HindsightError) {
    const missingBank = error.statusCode === 404;
    return {
      status: missingBank ? 409 : error.statusCode ?? 502,
      message: missingBank
        ? "This insurer's memory bank does not exist yet. Run npm run seed after the API keys are set."
        : error.message,
    };
  }
  return null;
}
