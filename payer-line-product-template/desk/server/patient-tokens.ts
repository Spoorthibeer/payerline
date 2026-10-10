import { randomInt } from "node:crypto";
import type { PatientTokenCase } from "../shared/types";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const tokens = new Map<string, { value: PatientTokenCase; expiresAt: number }>();

export function createPatientToken(value: PatientTokenCase): { token: string; expiresAt: string } {
  removeExpiredTokens();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const token = String(randomInt(0, 1_000_000)).padStart(6, "0");
    if (tokens.has(token)) continue;
    const expiresAt = Date.now() + TOKEN_TTL_MS;
    tokens.set(token, { value: structuredClone(value), expiresAt });
    return { token, expiresAt: new Date(expiresAt).toISOString() };
  }
  throw new Error("Could not create a patient token. Please try again.");
}

export function getPatientToken(token: string): PatientTokenCase | null {
  removeExpiredTokens();
  const stored = tokens.get(token);
  return stored ? structuredClone(stored.value) : null;
}

function removeExpiredTokens(): void {
  const now = Date.now();
  for (const [token, stored] of tokens) {
    if (stored.expiresAt <= now) tokens.delete(token);
  }
}
