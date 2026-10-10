import express from "express";
import cors from "cors";
import { PAYERS } from "@shared/payers";
import type { AdmissionCase, OutcomeInput } from "@shared/types";
import { credentialStatus, MissingConfigError } from "./env";
import { explainHindsightError, loadLedger } from "./hindsight";
import { extractAdmission } from "./groq";
import { recordOutcome, reviewAdmission } from "./review";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, credentials: credentialStatus(), payers: PAYERS });
});

app.post("/api/extract", async (req, res) => {
  try {
    const note = String(req.body?.note ?? "");
    if (note.trim().length < 20) {
      res.status(400).json({ error: "The clinical note is too short to read." });
      return;
    }
    const fields = await extractAdmission(note);
    res.json({ fields });
  } catch (error) {
    sendError(res, error);
  }
});

app.post("/api/review", async (req, res) => {
  try {
    const admission = req.body as AdmissionCase;
    if (!admission?.payerId || !admission.patientName?.trim() || !admission.procedure?.trim()) {
      res.status(400).json({ error: "Enter the patient name and procedure before reviewing." });
      return;
    }
    const review = await reviewAdmission(admission);
    res.json(review);
  } catch (error) {
    sendError(res, error);
  }
});

app.post("/api/outcome", async (req, res) => {
  try {
    const input = req.body as OutcomeInput;
    if (!input?.payerId || !input.caseSnapshot || !input.outcome || !input.reason?.trim()) {
      res.status(400).json({ error: "An outcome needs the case, the result, and the insurer's reason." });
      return;
    }
    const saved = await recordOutcome(input);
    const entries = await loadLedger(input.payerId);
    res.json({ ...saved, entries });
  } catch (error) {
    sendError(res, error);
  }
});

app.get("/api/ledger", async (req, res) => {
  try {
    const requested = typeof req.query.payer === "string" ? req.query.payer : "meridian";
    const payer = PAYERS.find((item) => item.id === requested) ?? PAYERS[0];
    const payerId = payer.id;
    const entries = await loadLedger(payerId);
    res.json({ payer, bankId: payer.bankId, entries });
  } catch (error) {
    sendError(res, error);
  }
});

function sendError(res: express.Response, error: unknown): void {
  if (error instanceof MissingConfigError) {
    res.status(error.status).json({ error: error.message, missing: error.missing });
    return;
  }
  const hindsightError = explainHindsightError(error);
  if (hindsightError) {
    res.status(hindsightError.status).json({ error: hindsightError.message });
    return;
  }
  const message = error instanceof Error ? error.message : "The desk could not complete that request.";
  res.status(500).json({ error: message });
}

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`PayerLine desk API listening on ${port}`);
});
