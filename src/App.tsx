import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DEFAULT_NOTE } from "@shared/history.ts";
import { PAYERS } from "@shared/payers.ts";
import type { AdmissionCase, LedgerEntry, PayerId, ReviewResponse } from "@shared/types.ts";
import { extractNote, getHealth, getLedger, reviewCase, saveOutcome } from "./api";

const EMPTY_CASE: AdmissionCase = {
  patientName: "Mrs. Ananya Rao",
  age: 46,
  mrn: "SB-44821",
  ward: "Surgical admission",
  scheduledAt: "Tomorrow, 07:40",
  diagnosis: "Acute calculus cholecystitis",
  procedure: "Laparoscopic cholecystectomy",
  payerId: "meridian",
  packageName: "management",
  ultrasoundAttached: true,
  ultrasoundDateOnLetterhead: false,
  cultureReportAttached: true,
  cultureContradictsDiagnosis: true,
  fitnessCertificateAttached: false,
  fitnessCertificateAgeDays: 0,
  clinicalNote: DEFAULT_NOTE,
};

export function App() {
  const [admission, setAdmission] = useState<AdmissionCase>(EMPTY_CASE);
  const [reviews, setReviews] = useState<Partial<Record<PayerId, ReviewResponse>>>({});
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [ledgerError, setLedgerError] = useState("");
  const [busy, setBusy] = useState<"read" | "review" | "save" | null>(null);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState<string[]>([]);
  const [credentials, setCredentials] = useState({ hindsight: false, groq: false });
  const [outcome, setOutcome] = useState<"approved" | "queried" | "denied">("denied");
  const [reason, setReason] = useState("");
  const [savedId, setSavedId] = useState("");
  const [clock, setClock] = useState(() => new Date());

  const payer = PAYERS.find((item) => item.id === admission.payerId) ?? PAYERS[0];
  const review = reviews[admission.payerId];

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    getHealth()
      .then((health) => setCredentials(health.credentials))
      .catch(() => setError("The desk API is not running."));
  }, []);

  useEffect(() => {
    if (!credentials.hindsight) return;
    setLedgerError("");
    getLedger(admission.payerId)
      .then((response) => setLedger(response.entries))
      .catch((err: Error) => setLedgerError(err.message));
  }, [admission.payerId, credentials.hindsight, savedId]);

  const packet = useMemo(
    () => [
      {
        key: "scan",
        label: "Ultrasound report",
        present: admission.ultrasoundAttached,
        note: admission.ultrasoundDateOnLetterhead ? "Date on letterhead" : "Date not on letterhead",
      },
      {
        key: "culture",
        label: "Culture report",
        present: admission.cultureReportAttached,
        note: admission.cultureContradictsDiagnosis ? "Conflicts with the diagnosis" : "Consistent with the diagnosis",
      },
      {
        key: "fitness",
        label: "Fitness certificate",
        present: admission.fitnessCertificateAttached,
        note: admission.fitnessCertificateAttached
          ? `${admission.fitnessCertificateAgeDays} days old`
          : "Not in the file",
      },
    ],
    [admission],
  );

  function patch(partial: Partial<AdmissionCase>) {
    setAdmission((current) => ({ ...current, ...partial }));
    setSavedId("");
  }

  async function onRead() {
    setBusy("read");
    setError("");
    setMissing([]);
    try {
      const { fields } = await extractNote(admission.clinicalNote);
      patch({ ...fields, clinicalNote: admission.clinicalNote });
    } catch (err) {
      const failure = err as Error & { missing?: string[] };
      setError(failure.message);
      setMissing(failure.missing ?? []);
    } finally {
      setBusy(null);
    }
  }

  async function onReview() {
    setBusy("review");
    setError("");
    setMissing([]);
    try {
      const result = await reviewCase(admission);
      setReviews((current) => ({ ...current, [admission.payerId]: result }));
    } catch (err) {
      const failure = err as Error & { missing?: string[] };
      setError(failure.message);
      setMissing(failure.missing ?? []);
    } finally {
      setBusy(null);
    }
  }

  async function onSave() {
    setBusy("save");
    setError("");
    try {
      const saved = await saveOutcome({
        payerId: admission.payerId,
        caseSnapshot: admission,
        outcome,
        reason,
      });
      setSavedId(saved.documentId);
      setLedger(saved.entries);
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The outcome was not stored.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="desk">
      <header className="mast">
        <div className="mark" aria-hidden="true">
          <span />
        </div>
        <div>
          <p className="eyebrow">St. Brigid Memorial · Revenue Cycle</p>
          <h1>Cashless pre-authorisation desk</h1>
        </div>
        <div className="mast-meta">
          <span>{clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <span>Theatre list · {admission.scheduledAt}</span>
          <span className={credentials.hindsight && credentials.groq ? "live" : "waiting"}>
            {credentials.hindsight && credentials.groq ? "Memory banks live" : "Awaiting credentials"}
          </span>
        </div>
      </header>

      {error ? (
        <div className="banner" role="alert">
          <strong>Desk notice.</strong> {error}
          {missing.length > 0 ? <span> Required: {missing.join(", ")}.</span> : null}
        </div>
      ) : null}

      <main>
        <section className="folder" aria-label="Case file">
          <div className="folder-spine" />
          <div className="folder-body">
            <div className="section-label">
              <span>01</span> Case file
            </div>
            <div className="identity">
              <div>
                <p className="patient">{admission.patientName}</p>
                <p className="muted">
                  {admission.age} years · MRN {admission.mrn} · {admission.ward}
                </p>
              </div>
              <p className="procedure">{admission.procedure}</p>
            </div>

            <div className="payer-switch" role="tablist" aria-label="Insurer">
              {PAYERS.map((item) => (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={item.id === admission.payerId}
                  className={item.id === admission.payerId ? "payer active" : "payer"}
                  onClick={() => patch({ payerId: item.id })}
                >
                  <span>{item.deskCode}</span>
                  <strong>{item.shortName}</strong>
                </button>
              ))}
            </div>
            <p className="posture">{payer.posture}</p>

            <label className="field">
              <span>Clinical note</span>
              <textarea
                value={admission.clinicalNote}
                onChange={(event) => patch({ clinicalNote: event.target.value })}
                rows={8}
              />
            </label>
            <button className="text-button" onClick={onRead} disabled={busy !== null}>
              {busy === "read" ? "Reading the note…" : "Read note into the file"}
            </button>

            <div className="grid">
              <label>
                Diagnosis
                <input value={admission.diagnosis} onChange={(event) => patch({ diagnosis: event.target.value })} />
              </label>
              <label>
                Package name
                <input
                  value={admission.packageName}
                  onChange={(event) => patch({ packageName: event.target.value })}
                />
              </label>
            </div>

            <div className="papers">
              {packet.map((paper, index) => (
                <motion.article
                  key={paper.key}
                  className={paper.present ? "paper in" : "paper out"}
                  layout
                  initial={false}
                  animate={{ rotate: paper.present ? index - 1 : 2, y: paper.present ? 0 : 6 }}
                >
                  <header>
                    <span>{paper.present ? "In packet" : "Held back"}</span>
                    <strong>{paper.label}</strong>
                  </header>
                  <p>{paper.note}</p>
                </motion.article>
              ))}
            </div>

            <div className="toggles">
              <Toggle
                label="Ultrasound attached"
                checked={admission.ultrasoundAttached}
                onChange={(ultrasoundAttached) => patch({ ultrasoundAttached })}
              />
              <Toggle
                label="Scan date on letterhead"
                checked={admission.ultrasoundDateOnLetterhead}
                onChange={(ultrasoundDateOnLetterhead) => patch({ ultrasoundDateOnLetterhead })}
              />
              <Toggle
                label="Culture report attached"
                checked={admission.cultureReportAttached}
                onChange={(cultureReportAttached) => patch({ cultureReportAttached })}
              />
              <Toggle
                label="Culture conflicts with diagnosis"
                checked={admission.cultureContradictsDiagnosis}
                onChange={(cultureContradictsDiagnosis) => patch({ cultureContradictsDiagnosis })}
              />
              <Toggle
                label="Fitness certificate attached"
                checked={admission.fitnessCertificateAttached}
                onChange={(fitnessCertificateAttached) => patch({ fitnessCertificateAttached })}
              />
              <label className="age">
                Fitness note age (days)
                <input
                  type="number"
                  min={0}
                  value={admission.fitnessCertificateAgeDays}
                  onChange={(event) => patch({ fitnessCertificateAgeDays: Number(event.target.value) })}
                />
              </label>
            </div>

            <button className="primary" onClick={onReview} disabled={busy !== null}>
              {busy === "review" ? "Consulting payer memory…" : `Review for ${payer.shortName}`}
            </button>
          </div>
        </section>

        <section className="docket" aria-live="polite" aria-label="Adjudication">
          <div className="section-label light">
            <span>02</span> Adjudication
          </div>
          <AnimatePresence mode="wait">
            {busy === "review" ? (
              <motion.div key="scan" className="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p>Searching {payer.bankId}</p>
                <div className="scan-sheet">
                  <span />
                </div>
                <p className="muted">Recall, then reflect, against this insurer alone.</p>
              </motion.div>
            ) : review ? (
              <motion.div key={review.reviewedAt} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="docket-top">
                  <div>
                    <p className="eyebrow">{payer.name}</p>
                    <h2>{review.decision.decision === "hold" ? "Do not send this file." : "Clear to send."}</h2>
                    <p className="summary">{review.decision.summary}</p>
                  </div>
                  <motion.div
                    className={`seal ${review.decision.decision}`}
                    initial={{ scale: 1.45, opacity: 0, rotate: -14 }}
                    animate={{ scale: 1, opacity: 1, rotate: -7 }}
                    transition={{ type: "spring", stiffness: 280, damping: 16 }}
                  >
                    <span>{review.decision.decision === "hold" ? "Hold" : "Send"}</span>
                    <small>{payer.deskCode}</small>
                  </motion.div>
                </div>

                <div className="meters">
                  <div>
                    <span>Confidence</span>
                    <div className={`bar ${review.decision.confidence}`}>
                      <motion.i
                        initial={{ width: 0 }}
                        animate={{ width: review.decision.confidence === "strong" ? "100%" : review.decision.confidence === "moderate" ? "66%" : "34%" }}
                      />
                    </div>
                    <em>{review.decision.confidence}</em>
                  </div>
                  <div className={review.decision.policyConflict ? "conflict on" : "conflict"}>
                    {review.decision.policyConflict
                      ? "Written policy and past outcomes disagree. Past outcomes govern."
                      : "No conflict with the written policy was cited."}
                  </div>
                </div>

                <div className="policy">
                  <h3>Written policy</h3>
                  <ul>
                    {payer.writtenPolicy.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>

                <div className="split">
                  <div>
                    <h3>Required before send</h3>
                    {review.decision.fixes.length === 0 ? (
                      <p className="muted">No document change was required.</p>
                    ) : (
                      <ol>
                        {review.decision.fixes.map((fix) => (
                          <li key={fix}>{fix}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                  <div>
                    <h3>Leave out</h3>
                    {review.decision.doNotAdd.length === 0 ? (
                      <p className="muted">Nothing in this packet was flagged as harmful.</p>
                    ) : (
                      <ul className="caution">
                        {review.decision.doNotAdd.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <h3>Evidence from memory</h3>
                <ul className="evidence">
                  {(review.decision.basedOn.length > 0 ? review.decision.basedOn : review.recalled).slice(0, 5).map((item, index) => (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 * index }}
                    >
                      <span>{item.type ?? "memory"}{item.occurred ? ` · ${item.occurred.slice(0, 10)}` : ""}</span>
                      <p>{item.text}</p>
                    </motion.li>
                  ))}
                </ul>

                <form
                  className="outcome"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void onSave();
                  }}
                >
                  <h3>Record what the insurer did</h3>
                  <div className="outcome-row">
                    {(["approved", "queried", "denied"] as const).map((kind) => (
                      <button
                        type="button"
                        key={kind}
                        className={outcome === kind ? "choice on" : "choice"}
                        onClick={() => setOutcome(kind)}
                      >
                        {kind}
                      </button>
                    ))}
                  </div>
                  <label>
                    Reason in the insurer’s words
                    <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} required />
                  </label>
                  <button className="primary dark" type="submit" disabled={busy !== null || reason.trim().length < 8}>
                    {busy === "save" ? "Writing into memory…" : "Write outcome into this bank"}
                  </button>
                  {savedId ? <p className="saved">Stored as {savedId}. Review the file again to see the new advice.</p> : null}
                </form>
              </motion.div>
            ) : (
              <motion.div key="empty" className="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="eyebrow">Awaiting review</p>
                <h2>The file has not been put to {payer.shortName} memory.</h2>
                <p>
                  The written policy is on the left of this docket once a review runs. Until then, the desk will not guess.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <aside className="ledger" aria-label="Memory ledger">
          <div className="section-label light">
            <span>03</span> Memory ledger
          </div>
          <p className="bank">{payer.bankId}</p>
          <p className="muted light">{payer.name} is isolated from the other insurer.</p>
          {ledgerError ? <p className="ledger-error">{ledgerError}</p> : null}
          <ol>
            <AnimatePresence>
              {ledger.map((entry, index) => (
                <motion.li
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 6) * 0.04 }}
                >
                  <span>{entry.type ?? "fact"}{entry.occurred ? ` · ${entry.occurred.slice(0, 10)}` : ""}</span>
                  <p>{entry.text}</p>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
          {ledger.length === 0 && !ledgerError ? (
            <p className="muted light">The ledger fills after the banks are seeded.</p>
          ) : null}
        </aside>
      </main>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={checked ? "toggle on" : "toggle"}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
    >
      <i />
      {label}
    </button>
  );
}
