import dotenv from "dotenv";
import path from "node:path";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

export class MissingConfigError extends Error {
  readonly status = 503;
  readonly missing: string[];

  constructor(missing: string[]) {
    super(`Missing ${missing.join(" and ")}. Add them to .env and restart the desk.`);
    this.missing = missing;
  }
}

export function hindsightConfig(): { baseUrl: string; apiKey: string } {
  const apiKey = process.env.HINDSIGHT_API_KEY?.trim() ?? "";
  if (!apiKey) {
    throw new MissingConfigError(["HINDSIGHT_API_KEY"]);
  }
  return {
    apiKey,
    baseUrl: process.env.HINDSIGHT_API_URL?.trim() || "https://api.hindsight.vectorize.io",
  };
}

export function groqConfig(): { apiKey: string; model: string } {
  const apiKey = process.env.GROQ_API_KEY?.trim() ?? "";
  if (!apiKey) {
    throw new MissingConfigError(["GROQ_API_KEY"]);
  }
  return {
    apiKey,
    model: process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b",
  };
}

export function credentialStatus(): { hindsight: boolean; groq: boolean } {
  return {
    hindsight: Boolean(process.env.HINDSIGHT_API_KEY?.trim()),
    groq: Boolean(process.env.GROQ_API_KEY?.trim()),
  };
}
