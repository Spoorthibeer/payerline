import type {
  AdmissionCase,
  ExtractedFields,
  LedgerResponse,
  PayerId,
  ReviewResponse,
} from "@shared/types.ts";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = (await response.json()) as T & { error?: string; missing?: string[] };
  if (!response.ok) {
    const error = new Error(body.error || "The desk could not complete that request.") as Error & {
      missing?: string[];
    };
    error.missing = body.missing;
    throw error;
  }
  return body;
}

export function getHealth(): Promise<{
  ok: boolean;
  credentials: { hindsight: boolean; groq: boolean };
}> {
  return request("/api/health");
}

export function extractNote(note: string): Promise<{ fields: ExtractedFields }> {
  return request("/api/extract", { method: "POST", body: JSON.stringify({ note }) });
}

export function reviewCase(admission: AdmissionCase): Promise<ReviewResponse> {
  return request("/api/review", { method: "POST", body: JSON.stringify(admission) });
}

export function saveOutcome(input: {
  payerId: PayerId;
  caseSnapshot: AdmissionCase;
  outcome: "approved" | "queried" | "denied";
  reason: string;
}): Promise<{ documentId: string; entries: LedgerResponse["entries"] }> {
  return request("/api/outcome", { method: "POST", body: JSON.stringify(input) });
}

export function getLedger(payer: PayerId): Promise<LedgerResponse> {
  return request(`/api/ledger?payer=${payer}`);
}
