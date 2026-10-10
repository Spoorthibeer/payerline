import { HindsightClient, HindsightError } from "@vectorize-io/hindsight-client";
import type { EvidenceItem, LedgerEntry, PayerId } from "@shared/types";
import { PROCEDURES } from "@shared/catalog";
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
const HINDSIGHT_REQUEST_TIMEOUT_MS = 30_000;

function requestSignal(): AbortSignal {
  return AbortSignal.timeout(HINDSIGHT_REQUEST_TIMEOUT_MS);
}

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
  return `You are the cashless pre-authorisation memory for ${payerName}. You stop files this insurer has rejected before. You cite dates, procedures, document facts, outcomes, and reasons. Never retain patient identities, personal details, or document contents. You never choose treatment.`;
}

export async function provisionBanks(): Promise<void> {
  const api = hindsight();
  for (const [index, payer] of PAYERS.entries()) {
    try {
      await api.createBank(payer.bankId, {
        name: payer.name,
        reflectMission: bankMission(payer.name),
        signal: requestSignal(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/already exists|409|conflict/i.test(message)) throw error;
    }
    try {
      await api.updateBankConfig(payer.bankId, {
        reflectMission: bankMission(payer.name),
        retainMission:
          "Extract only the insurer, procedure, document-presence and document-quality facts, outcome, and reason. Never retain patient identities, personal identifiers, diagnosis details, hospital details, clinical notes, or document contents.",
        retainExtractionMode: "verbose",
        observationsMission:
          "Observations are durable rules about what this insurer actually approves or rejects. Keep only procedure, document facts, outcome, and reason. Never include patient identities, personal identifiers, hospital details, clinical notes, or document contents. Revise a rule when a newer outcome contradicts it.",
        dispositionSkepticism: 5,
        dispositionLiteralism: 5,
        dispositionEmpathy: 2,
        enableObservations: true,
        signal: requestSignal(),
      });

      const existing = await api.listDirectives(payer.bankId, { signal: requestSignal() });
      const names = new Set(existing.items.map((item) => item.name));
      for (const directive of DIRECTIVES) {
        if (!names.has(directive.name)) {
          await api.createDirective(payer.bankId, directive.name, directive.content, {
            priority: 10,
            signal: requestSignal(),
          });
        }
      }
    } catch (error) {
      throw new Error(`Failed provisioning ${payer.name} (${payer.bankId}): ${errorMessage(error)}`, {
        cause: error,
      });
    }
    console.log(`${payer.name}: bank ${index + 1}/${PAYERS.length} ready`);
  }
}

export async function retainHistory(): Promise<number> {
  const api = hindsight();
  const bankTotals = new Map(PAYERS.map((payer) => [payer.id, HISTORY.filter((item) => item.payerId === payer.id).length]));
  const bankProgress = new Map(PAYERS.map((payer) => [payer.id, 0]));
  for (const [index, item] of HISTORY.entries()) {
    const payer = payerById(item.payerId);
    try {
      for (let attempt = 1; ; attempt += 1) {
        try {
          const response = await api.retain(payer.bankId, item.content, {
            timestamp: item.timestamp,
            context: item.context,
            documentId: item.documentId,
            tags: item.tags,
            updateMode: "replace",
            signal: requestSignal(),
          });
          if (response.async && response.operation_id) {
            await waitForOperation(payer.bankId, response.operation_id);
          }
          break;
        } catch (error) {
          if (attempt >= 3 || !isTimeoutError(error)) throw error;
          console.warn(
            `${payer.name}: request timed out retaining ${item.documentId}; retry ${attempt}/2 with replace`,
          );
        }
      }
    } catch (error) {
      throw new Error(
        `Failed retaining bank ${payer.bankId} document ${item.documentId} (${index + 1}/${HISTORY.length}): ${errorMessage(error)}`,
        { cause: error },
      );
    }
    const savedForBank = (bankProgress.get(payer.id) ?? 0) + 1;
    bankProgress.set(payer.id, savedForBank);
    console.log(`${payer.name}: ${savedForBank}/${bankTotals.get(payer.id)} saved (${item.documentId})`);
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
    context: `live cashless outcome recorded for ${payer.name}`,
    documentId: input.documentId,
    tags: input.tags,
    updateMode: "replace",
    signal: requestSignal(),
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
    signal: requestSignal(),
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
    signal: requestSignal(),
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
    api.listMemories(payer.bankId, { type: "observation", limit: 8, signal: requestSignal() }),
    api.listMemories(payer.bankId, { limit: 20, signal: requestSignal() }),
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
  const payer = payerById(payerId);
  const memories = await hindsight().listMemories(payer.bankId, {
    limit: 100,
    signal: requestSignal(),
  });
  const entries: LedgerEntry[] = memories.items.flatMap((item) =>
    item.text
      ? [{
          id: item.id,
          text: item.text,
          type: item.fact_type ?? undefined,
          occurred: item.date || undefined,
          context: item.context,
        }]
      : [],
  );
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
  return (
    PROCEDURES.find((item) => item.name.toLowerCase() === procedure.trim().toLowerCase())?.tag ??
    `procedure:${procedure
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}`
  );
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
    const response = await fetchWithTimeout(
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

async function fetchWithTimeout(input: string | URL | Request, init: RequestInit = {}): Promise<Response> {
  const timeout = requestSignal();
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" ||
      error.name === "AbortError" ||
      /timeout|timed out|aborted|fetch failed|network|socket/i.test(error.message))
  );
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
