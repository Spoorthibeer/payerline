'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, CircleSlash, Loader2, ScanLine, Sparkles } from 'lucide-react'
import type { AdmissionCase, DocumentChecklist, PatientTokenCase, PayerId, ReviewResponse } from '@shared/types'
import { DOCUMENT_LABELS } from '@shared/packet'
import { HOSPITALS, PROCEDURES } from '@shared/catalog'
import { cn } from '@/lib/utils'
import {
  addPendingApprovalReview,
  loadPendingApprovalReviews,
  removePendingApprovalReview,
  type PendingApprovalReview,
} from '@/lib/pending-approval-reviews'
import { patient as demoPatient, payers } from './data'
import { usePatient } from './patient-context'
import { patientText, patientDocuments } from '@/lib/i18n'

type Phase = 'idle' | 'scanning' | 'done' | 'error'

const initialDocuments: DocumentChecklist = {
  preAuthorizationForm: true,
  insurerCard: true,
  identityProof: 'aadhaar',
  policyCopy: true,
  admissionAdvice: true,
  investigationReports: true,
  investigationReportsOnLetterheadAndDated: false,
  investigationReportsMatchDiagnosis: true,
  cbcAttached: true,
  fitnessCertificate: true,
  fitnessCertificateAgeDays: 5,
  signedSurgicalConsent: true,
  itemisedEstimate: true,
  mlcFir: false,
}

export function LiveDemo() {
  const [payerId, setPayerId] = useState<PayerId>('bharat-arogya')
  const [packageName, setPackageName] = useState('management')
  const [packageCode, setPackageCode] = useState<string>(PROCEDURES[0].packageCode)
  const [documents, setDocuments] = useState<DocumentChecklist>(initialDocuments)
  const [accidentCase, setAccidentCase] = useState(false)
  const { patient, setPatient, language } = usePatient()
  const [phase, setPhase] = useState<Phase>('idle')
  const [review, setReview] = useState<ReviewResponse | null>(null)
  const [error, setError] = useState('')
  const [outcome, setOutcome] = useState<'approved' | 'queried' | 'denied'>('denied')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')
  const [sentAt, setSentAt] = useState('')
  const [countdownNow, setCountdownNow] = useState(Date.now())
  const [amountRequested, setAmountRequested] = useState('')
  const [amountApproved, setAmountApproved] = useState('')
  const [decisionMinutes, setDecisionMinutes] = useState('')
  const [queryRaisedFirst, setQueryRaisedFirst] = useState('')
  const [queriedDocument, setQueriedDocument] = useState('')
  const [offChecklistDocument, setOffChecklistDocument] = useState('')
  const [approvalNote, setApprovalNote] = useState('')
  const [pendingCases, setPendingCases] = useState<PendingApprovalReview[]>([])
  const [activePendingId, setActivePendingId] = useState('')
  const [patientToken, setPatientToken] = useState('')
  const [tokenError, setTokenError] = useState('')
  const didAutoReview = useRef(false)
  const text = patientText[language]

  const payer = payers.find((item) => item.id === payerId)!
  const procedureName = patient.procedure.trim()
  const procedure = PROCEDURES.find((item) => item.name === procedureName) ?? PROCEDURES[0]
  const hospital = HOSPITALS.find((item) => item.id === patient.hospitalId) ?? HOSPITALS[0]

  const reset = () => {
    setPhase('idle')
    setReview(null)
    setError('')
    setSaved('')
  }

  const updateDocument = <K extends keyof DocumentChecklist>(key: K, value: DocumentChecklist[K]) => {
    setDocuments((current) => ({ ...current, [key]: value }))
    reset()
  }

  useEffect(() => {
    const savedPendingCases = loadPendingApprovalReviews()
    setPendingCases(savedPendingCases)
    if (savedPendingCases[0]) {
      setActivePendingId(savedPendingCases[0].id)
      setOutcome('approved')
    }
  }, [])

  useEffect(() => {
    if (!sentAt) return
    const interval = window.setInterval(() => setCountdownNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [sentAt])

  useEffect(() => {
    setPackageCode(procedure.packageCode)
    reset()
  }, [procedure.packageCode])

  const admission: AdmissionCase = {
    patientName: patient.name,
    age: patient.age,
    gender: patient.gender,
    mrn: patient.mrn,
    ward: patient.ward,
    scheduledAt: patient.scheduledAt,
    hospitalId: patient.hospitalId,
    diagnosis: patient.diagnosis,
    procedure: patient.procedure,
    payerId,
    packageName,
    packageCode,
    accidentCase,
    sentAt: sentAt || undefined,
    documents,
    clinicalNote: `${patient.name}, ${patient.age}, ${patient.gender}, ${patient.procedure}, ${payer.name}. Package name: ${packageName}.`,
  }

  const run = async (caseToReview: AdmissionCase = admission) => {
    if (!caseToReview.patientName.trim() || !caseToReview.procedure.trim()) {
      setPhase('error')
      setError('Enter the patient name and procedure in the patient file before reviewing.')
      return
    }
    setPhase('scanning')
    setError('')
    setSaved('')
    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(caseToReview),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'The desk could not review this file.')
      setReview(body)
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The review did not complete.')
      setPhase('error')
    }
  }

  const openPatientToken = async () => {
    setTokenError('')
    try {
      const response = await fetch(`/api/patient-token?token=${encodeURIComponent(patientToken)}`)
      const body: unknown = await response.json()
      if (!response.ok) {
        const message = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
          ? body.error
          : 'The patient token could not be opened.'
        throw new Error(message)
      }
      const tokenCase = parsePatientTokenCase(body)
      if (!tokenCase) throw new Error('The patient token contains an invalid case.')
      setPatientToken('')
      const tokenAdmission: AdmissionCase = {
        patientName: 'Patient',
        age: 0,
        gender: '',
        mrn: '',
        ward: '',
        scheduledAt: '',
        diagnosis: '',
        clinicalNote: '',
        ...tokenCase,
      }
      const selectedProcedure = PROCEDURES.find((item) => item.name === tokenCase.procedure) ?? PROCEDURES[0]
      setPatient({
        ...patient,
        name: 'Patient',
        age: 0,
        gender: '',
        mrn: '',
        hospitalId: tokenCase.hospitalId,
        diagnosis: '',
        procedure: tokenCase.procedure,
      })
      setPayerId(tokenCase.payerId)
      setPackageName(tokenCase.packageName)
      setPackageCode(tokenCase.packageCode || selectedProcedure.packageCode)
      setDocuments(tokenCase.documents)
      setAccidentCase(tokenCase.accidentCase)
      setSentAt('')
      setPhase('idle')
      setReview(null)
      await run(tokenAdmission)
    } catch (caught) {
      setTokenError(caught instanceof Error ? caught.message : 'The patient token could not be opened.')
    }
  }

  useEffect(() => {
    if (didAutoReview.current) return
    didAutoReview.current = true
    void run()
  }, [])

  const saveOutcome = async () => {
    if (!review || (outcome !== 'approved' && reason.trim().length < 8)) return
    setSaving(true)
    setError('')
    try {
      const approvalReview = outcome === 'approved'
        ? {
            amountRequested: Number(amountRequested),
            amountApproved: Number(amountApproved),
            decisionMinutes: Number(decisionMinutes),
            queryRaisedFirst: queryRaisedFirst === 'yes',
            queriedDocument: queryRaisedFirst === 'yes' ? queriedDocument : undefined,
            offChecklistDocument,
            note: approvalNote,
          }
        : undefined
      const response = await fetch('/api/outcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payerId,
          outcome,
          reason: outcome === 'approved' ? undefined : reason,
          approvalReview,
          caseSnapshot: { ...admission, clinicalNote: reason },
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'The outcome was not stored.')
      setSaved(body.documentId)
      setReason('')
      if (activePendingId && outcome === 'approved') {
        setPendingCases(removePendingApprovalReview(activePendingId))
        setActivePendingId('')
      }
      setAmountRequested('')
      setAmountApproved('')
      setDecisionMinutes('')
      setQueryRaisedFirst('')
      setQueriedDocument('')
      setOffChecklistDocument('')
      setApprovalNote('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The outcome was not stored.')
    } finally {
      setSaving(false)
    }
  }

  const beginApprovalReview = () => {
    setOutcome('approved')
    const id = activePendingId || `${payerId}-${Date.now()}`
    setActivePendingId(id)
    setPendingCases(addPendingApprovalReview({
      id,
      procedure: patient.procedure,
      payer: payer.name,
      createdAt: new Date().toISOString(),
    }))
    setDecisionMinutes(sentAt ? String(Math.max(0, Math.round((Date.now() - Date.parse(sentAt)) / 60_000))) : '')
  }

  const selectOutcome = (kind: 'approved' | 'queried' | 'denied') => {
    if (kind === 'approved') {
      beginApprovalReview()
      return
    }
    setOutcome(kind)
  }

  const irdaDeadline = sentAt ? new Date(Date.parse(sentAt) + 60 * 60 * 1000) : null
  const remainingMs = irdaDeadline ? Math.max(0, irdaDeadline.getTime() - countdownNow) : 0
  const remainingMinutes = Math.floor(remainingMs / 60_000)
  const remainingSeconds = Math.floor((remainingMs % 60_000) / 1000)
  const approvalReady =
    amountRequested.trim() !== '' &&
    Number.isFinite(Number(amountRequested)) &&
    Number(amountRequested) > 0 &&
    amountApproved.trim() !== '' &&
    Number.isFinite(Number(amountApproved)) &&
    Number(amountApproved) >= 0 &&
    Number(amountApproved) <= Number(amountRequested) &&
    decisionMinutes.trim() !== '' &&
    Number.isFinite(Number(decisionMinutes)) &&
    Number(decisionMinutes) >= 0 &&
    !!queryRaisedFirst &&
    (queryRaisedFirst !== 'yes' || !!queriedDocument.trim())

  const evidence = review
    ? (review.outcomes && review.outcomes.length > 0
        ? review.outcomes
        : review.decision.basedOn.length > 0
          ? review.decision.basedOn
          : review.recalled
      ).slice(0, 6)
    : []
  const holding = review?.decision.decision === 'hold'
  const evidenceProcedure = patient.procedure.trim() || packageName
  const packageAligned =
    !!patient.procedure.trim() &&
    packageName.trim().toLowerCase() === patient.procedure.trim().toLowerCase()

  return (
    <>
    <section id="demo" className="relative scroll-mt-16 overflow-hidden bg-ink py-24 text-ink-foreground md:py-32">
      <div aria-hidden="true" className="absolute inset-0 bg-grid-ink [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-success">Try it · live memory check</p>
          <h2 className="mt-4 text-balance font-serif text-4xl leading-tight md:text-6xl">
            One packet. One insurer&apos;s memory at a time.
          </h2>
          <p className="mt-5 max-w-2xl text-pretty text-lg text-ink-muted">
            {patient.procedure} at {hospital.name}, {hospital.city}. Choose the insurer and record the documents in the packet.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="rounded-2xl border border-ink-border bg-white/[0.03] p-6">
            <fieldset>
              <legend className="font-mono text-xs uppercase tracking-widest text-ink-muted">Insurer bank</legend>
              <div className="mt-3 grid gap-2">
                {payers.map((item) => (
                  <label
                    key={item.id}
                    className={cn(
                      'flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors',
                      payerId === item.id ? 'border-success/60 bg-success/10' : 'border-ink-border hover:bg-white/[0.04]',
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="insurer"
                        value={item.id}
                        checked={payerId === item.id}
                        onChange={() => {
                          setPayerId(item.id)
                          reset()
                        }}
                        className="size-4 accent-[oklch(0.6_0.13_162)]"
                      />
                      {item.name}
                    </span>
                    <span className="font-mono text-xs text-ink-muted">{item.deskCode}</span>
                  </label>
                ))}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{payer.posture}</p>
            </fieldset>

            <div className="mt-5 rounded-xl border border-ink-border p-4">
              <label htmlFor="patient-token" className="font-mono text-xs uppercase tracking-widest text-ink-muted">
                {text.tokenLabel}
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                <input
                  id="patient-token"
                  inputMode="numeric"
                  maxLength={6}
                  value={patientToken}
                  onChange={(event) => setPatientToken(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-10 min-w-0 flex-1 rounded-lg border border-ink-border bg-ink px-3 text-sm tracking-[0.25em]"
                />
                <button type="button" disabled={patientToken.length !== 6} onClick={() => void openPatientToken()} className="h-10 rounded-lg border border-ink-border px-3 text-sm disabled:opacity-50">
                  Open patient token
                </button>
              </div>
              {tokenError ? <p role="alert" className="mt-2 text-sm text-destructive">{tokenError}</p> : null}
              <button type="button" onClick={() => window.print()} className="mt-3 rounded-lg border border-ink-border px-3 py-2 text-sm">
                Print checklist in patient&apos;s language
              </button>
            </div>

            <div className="mt-6">
              <label htmlFor="package" className="font-mono text-xs uppercase tracking-widest text-ink-muted">
                Package name / code matching the procedure
              </label>
              <input
                id="package"
                type="text"
                value={packageName}
                onChange={(event) => {
                  setPackageName(event.target.value)
                  reset()
                }}
                className="mt-3 w-full rounded-xl border border-ink-border bg-ink px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-success/60"
                placeholder={procedure.name}
              />
            </div>
            {payerId === 'jan-raksha-yojana' ? (
              <div className="mt-4">
                <label htmlFor="package-code" className="font-mono text-xs uppercase tracking-widest text-ink-muted">
                  Jan Raksha package code
                </label>
                <input
                  id="package-code"
                  type="text"
                  value={packageCode}
                  onChange={(event) => {
                    setPackageCode(event.target.value)
                    reset()
                  }}
                  className="mt-3 w-full rounded-xl border border-ink-border bg-ink px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-success/60"
                />
              </div>
            ) : null}

            <fieldset className="mt-6">
              <legend className="font-mono text-xs uppercase tracking-widest text-ink-muted">What is in today&apos;s packet</legend>
              <div className="mt-3 grid gap-2">
                <Toggle label={DOCUMENT_LABELS.preAuthorizationForm} checked={documents.preAuthorizationForm} onChange={(value) => updateDocument('preAuthorizationForm', value)} />
                <Toggle
                  label={payerId === 'jan-raksha-yojana' ? 'Ayushman-style Jan Raksha e-card' : DOCUMENT_LABELS.insurerCard}
                  checked={documents.insurerCard}
                  onChange={(value) => updateDocument('insurerCard', value)}
                />
                <label className="flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm text-ink-foreground">
                  <span>{DOCUMENT_LABELS.identityProof}</span>
                  <select
                    value={documents.identityProof}
                    onChange={(event) => updateDocument('identityProof', event.target.value as DocumentChecklist['identityProof'])}
                    className="rounded-lg border border-ink-border bg-ink px-3 py-2 text-ink-foreground"
                  >
                    <option value="aadhaar">Aadhaar + e-KYC</option>
                    <option value="pan">PAN card</option>
                    <option value="voter-id">Voter ID</option>
                    <option value="missing">Not attached</option>
                  </select>
                </label>
                <Toggle label={DOCUMENT_LABELS.policyCopy} checked={documents.policyCopy} onChange={(value) => updateDocument('policyCopy', value)} />
                <Toggle label={DOCUMENT_LABELS.admissionAdvice} checked={documents.admissionAdvice} onChange={(value) => updateDocument('admissionAdvice', value)} />
                <Toggle label={`${DOCUMENT_LABELS.investigationReports} (ultrasound / blood tests as relevant)`} checked={documents.investigationReports} onChange={(value) => updateDocument('investigationReports', value)} />
                <Toggle label="Reports are dated on hospital letterhead" checked={documents.investigationReportsOnLetterheadAndDated} onChange={(value) => updateDocument('investigationReportsOnLetterheadAndDated', value)} />
                <Toggle label="Laboratory reports match the diagnosis" checked={documents.investigationReportsMatchDiagnosis} onChange={(value) => updateDocument('investigationReportsMatchDiagnosis', value)} />
                <Toggle label={DOCUMENT_LABELS.cbcAttached} checked={documents.cbcAttached} onChange={(value) => updateDocument('cbcAttached', value)} />
                <Toggle label={DOCUMENT_LABELS.fitnessCertificate} checked={documents.fitnessCertificate} onChange={(value) => updateDocument('fitnessCertificate', value)} />
                {documents.fitnessCertificate ? (
                  <label className="flex items-center justify-between text-sm text-ink-muted">
                    Physician fitness certificate age (days)
                    <input
                      type="number"
                      min={0}
                      value={documents.fitnessCertificateAgeDays}
                      onChange={(event) => updateDocument('fitnessCertificateAgeDays', Number(event.target.value))}
                      className="w-20 rounded-lg border border-ink-border bg-ink px-3 py-2 text-ink-foreground"
                    />
                  </label>
                ) : null}
                <Toggle label={DOCUMENT_LABELS.signedSurgicalConsent} checked={documents.signedSurgicalConsent} onChange={(value) => updateDocument('signedSurgicalConsent', value)} />
                <Toggle label={DOCUMENT_LABELS.itemisedEstimate} checked={documents.itemisedEstimate} onChange={(value) => updateDocument('itemisedEstimate', value)} />
                <Toggle label="Accident case" checked={accidentCase} onChange={(value) => { setAccidentCase(value); reset() }} />
                {accidentCase ? (
                  <Toggle label={DOCUMENT_LABELS.mlcFir} checked={documents.mlcFir} onChange={(value) => updateDocument('mlcFir', value)} />
                ) : null}
              </div>
            </fieldset>

            <button
              type="button"
              onClick={() => void run()}
              disabled={phase === 'scanning'}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-success text-sm font-medium text-success-foreground transition-all hover:brightness-110 disabled:opacity-70"
            >
              {phase === 'scanning' ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ScanLine className="size-4" aria-hidden="true" />}
              {phase === 'scanning' ? 'Recalling this bank…' : phase === 'done' ? 'Reflect again' : 'Review against memory'}
            </button>
          </div>

          <div className="relative min-h-[520px] overflow-hidden rounded-2xl border border-ink-border bg-white/[0.03]" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-border px-6 py-4">
              <div>
                <p className="text-sm font-medium">{patient.procedure || 'Procedure not entered'}</p>
                <p className="font-mono text-xs text-ink-muted">
                  {hospital.name} · {hospital.city} · {payer.name}
                </p>
              </div>
              {review && phase === 'done' ? (
                <span className={cn('rounded-full px-3 py-1 font-mono text-xs uppercase tracking-widest', holding ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success')}>
                  {holding ? 'Hold' : 'Send'} · {review.decision.confidence}
                </span>
              ) : null}
              {activePendingId && !saved ? (
                <span className="rounded-full bg-warning/20 px-3 py-1 font-mono text-xs uppercase tracking-widest text-warning">
                  Review pending
                </span>
              ) : null}
            </div>

            {phase === 'idle' && (
              <div className="flex h-[440px] flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="relative flex size-16 items-center justify-center rounded-2xl border border-ink-border">
                  <Sparkles className="size-6 text-success" aria-hidden="true" />
                  <span aria-hidden="true" className="absolute inset-0 animate-ping-slow rounded-2xl border border-success/40" />
                </div>
                <p className="max-w-sm text-balance text-ink-muted">
                  The ultrasound is attached. The written policy would allow this file. Memory may not. Bank {payer.deskCode} stays closed to the other insurer.
                </p>
              </div>
            )}

            {phase === 'scanning' && (
              <div className="relative h-[440px] px-6 py-6">
                <div aria-hidden="true" className="absolute inset-x-0 h-16 animate-scan bg-gradient-to-b from-transparent via-success/20 to-transparent" />
                <ul className="space-y-3">
                  {['Recall similar cases', 'Read written policy', 'Reflect on past outcomes'].map((label, index) => (
                    <li key={label} className="h-14 animate-pulse rounded-xl bg-white/[0.05]" style={{ animationDelay: `${index * 120}ms` }} />
                  ))}
                </ul>
                <p className="mt-6 font-mono text-xs text-ink-muted">Searching {payer.name} only…</p>
              </div>
            )}

            {phase === 'error' && (
              <div className="flex h-[440px] items-center px-6">
                <p className="rounded-xl bg-destructive/15 px-4 py-3 text-sm">{error}</p>
              </div>
            )}

            {phase === 'done' && review && (
              <div className="px-6 py-6">
                <div className="mb-5 rounded-xl border border-ink-border px-4 py-3">
                  {sentAt ? (
                    <p className="text-sm">
                      Insurer must decide within 1 hour (by{' '}
                      <span className="font-mono">
                        {irdaDeadline?.toLocaleTimeString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })} IST
                      </span>
                      ) · {String(remainingMinutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')} remaining
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSentAt(new Date().toISOString())
                        setCountdownNow(Date.now())
                      }}
                      className="rounded-lg border border-ink-border px-3 py-2 text-sm"
                    >
                      Mark sent to insurer
                    </button>
                  )}
                </div>
                <div className={cn('rounded-xl px-4 py-3 text-sm', holding ? 'bg-destructive/15' : 'bg-success/15')}>
                  <div className="flex items-start gap-3">
                    {holding ? <CircleSlash className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" /> : <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />}
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="font-medium">{holding ? 'Hold — do not send this file.' : 'Send — packet is clear.'}</p>
                      <p className="text-ink-muted">{review.decision.summary}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-ink-border px-4 py-3 text-sm">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Checklist says · {review.checklist.decision}</p>
                    <p className="mt-1 text-ink-muted">{review.checklist.summary}</p>
                  </div>
                  <div className="rounded-xl border border-ink-border px-4 py-3 text-sm">
                    <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Memory says · {review.memoryDecision.decision}</p>
                    <p className="mt-1 text-ink-muted">{review.memoryDecision.summary}</p>
                  </div>
                </div>

                {review.decision.policyConflict ? (
                  <p className="mt-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
                    Written policy and past outcomes disagree. Past outcomes govern.
                  </p>
                ) : null}

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-mono text-xs uppercase tracking-widest text-ink-muted">Missing required documents</h3>
                    <p className="mt-1 text-xs text-ink-muted">Based on the fields you selected for this insurer.</p>
                    <ul className="mt-3 space-y-2">
                      {review.decision.fixes.length === 0 ? (
                        <li className="rounded-xl border border-success/30 px-3 py-2 text-sm text-success">None — required papers are present.</li>
                      ) : (
                        review.decision.fixes.map((fix) => (
                          <li key={fix} className="rounded-xl border border-ink-border px-3 py-2 text-sm">
                            {fix}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-mono text-xs uppercase tracking-widest text-ink-muted">Do not keep in this packet</h3>
                    <p className="mt-1 text-xs text-ink-muted">Attached papers that have caused queries or denials.</p>
                    <ul className="mt-3 space-y-2">
                      {review.decision.doNotAdd.length === 0 ? (
                        <li className="rounded-xl border border-success/30 px-3 py-2 text-sm text-success">None — nothing harmful is selected.</li>
                      ) : (
                        review.decision.doNotAdd.map((item) => (
                          <li key={item} className="rounded-xl border border-destructive/30 px-3 py-2 text-sm">
                            {item}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-mono text-xs uppercase tracking-widest text-ink-muted">
                    Evidence from {review.bankId}
                  </h3>
                  <p className="mt-1 text-xs text-ink-muted">
                    Recent stored outcomes for{' '}
                    <span className="text-ink-foreground">{evidenceProcedure || 'this procedure'}</span>
                    {packageAligned
                      ? ' · package matches procedure'
                      : ' · set package to the same procedure name for a matched packet'}
                  </p>
                  <ul className="mt-3 space-y-3">
                    {evidence.length === 0 ? (
                      <li className="rounded-xl border border-ink-border px-4 py-3 text-sm text-ink-muted">
                        No stored outcomes for this procedure were found in this bank yet.
                      </li>
                    ) : (
                      evidence.map((item) => (
                        <li key={item.id} className="rounded-xl border border-ink-border px-4 py-3">
                          <p className="font-mono text-[11px] uppercase tracking-wider text-success">
                            {item.type || 'outcome'}
                            {item.occurred ? ` · ${item.occurred.slice(0, 10)}` : ''}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{item.text}</p>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <form
                  className="mt-6 border-t border-ink-border pt-5"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void saveOutcome()
                  }}
                >
                  <h3 className="font-mono text-xs uppercase tracking-widest text-ink-muted">Record what the insurer did</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(['approved', 'queried', 'denied'] as const).map((kind) => (
                      <button key={kind} type="button" disabled={!!activePendingId && kind !== 'approved'} onClick={() => selectOutcome(kind)} className={cn('rounded-full border px-3 py-1 text-xs uppercase tracking-wider disabled:cursor-not-allowed disabled:opacity-40', outcome === kind ? 'border-success bg-success/15 text-success' : 'border-ink-border text-ink-muted')}>
                        {kind}
                      </button>
                    ))}
                  </div>
                  {outcome === 'approved' ? (
                    <div className="mt-4 space-y-4 rounded-xl border border-ink-border p-4">
                      <p className="text-sm font-medium">Approval review · required before the case can close</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm">
                          Amount requested (₹)
                          <input type="number" min="1" required value={amountRequested} onChange={(event) => setAmountRequested(event.target.value)} className="mt-1 w-full rounded-lg border border-ink-border bg-ink px-3 py-2" />
                        </label>
                        <label className="block text-sm">
                          Amount approved (₹)
                          <input type="number" min="0" required value={amountApproved} onChange={(event) => setAmountApproved(event.target.value)} className="mt-1 w-full rounded-lg border border-ink-border bg-ink px-3 py-2" />
                        </label>
                        <label className="block text-sm">
                          Time to decide (minutes)
                          <input type="number" min="0" required value={decisionMinutes} onChange={(event) => setDecisionMinutes(event.target.value)} className="mt-1 w-full rounded-lg border border-ink-border bg-ink px-3 py-2" />
                        </label>
                        <label className="block text-sm">
                          Did the insurer raise a query first?
                          <select required value={queryRaisedFirst} onChange={(event) => setQueryRaisedFirst(event.target.value)} className="mt-1 w-full rounded-lg border border-ink-border bg-ink px-3 py-2">
                            <option value="">Select yes or no</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </label>
                        {queryRaisedFirst === 'yes' ? (
                          <label className="block text-sm sm:col-span-2">
                            Which document did the insurer query?
                            <input required value={queriedDocument} onChange={(event) => setQueriedDocument(event.target.value)} className="mt-1 w-full rounded-lg border border-ink-border bg-ink px-3 py-2" />
                          </label>
                        ) : null}
                        <label className="block text-sm sm:col-span-2">
                          Any document requested that was not on the checklist? (optional)
                          <input value={offChecklistDocument} onChange={(event) => setOffChecklistDocument(event.target.value)} className="mt-1 w-full rounded-lg border border-ink-border bg-ink px-3 py-2" />
                        </label>
                        <label className="block text-sm sm:col-span-2">
                          Note (optional)
                          <textarea rows={2} value={approvalNote} onChange={(event) => setApprovalNote(event.target.value)} className="mt-1 w-full rounded-lg border border-ink-border bg-ink px-3 py-2" />
                        </label>
                      </div>
                      {pendingCases.length > 0 ? (
                        <div className="rounded-lg bg-warning/10 p-3 text-sm">
                          <p className="font-medium">Pending approval reviews</p>
                          <ul className="mt-2 space-y-1">
                            {pendingCases.map((pending) => (
                              <li key={pending.id}>{pending.procedure} · {pending.payer}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <textarea
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      rows={3}
                      required
                      placeholder="The insurer’s reason, in their words"
                      className="mt-3 w-full rounded-xl border border-ink-border bg-ink px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-success/60"
                    />
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={saving || (outcome === 'approved' ? !approvalReady : reason.trim().length < 8)}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-ink-border px-4 text-sm disabled:opacity-50"
                    >
                      {saving ? 'Writing into memory…' : outcome === 'approved' ? 'Submit approval review and close case' : 'Write outcome into this bank'}
                    </button>
                    <button
                      type="button"
                      disabled={pendingCases.length > 0}
                      onClick={() => {
                        reset()
                        setOutcome('denied')
                        setSentAt('')
                      }}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-ink-border px-4 text-sm disabled:opacity-50"
                      title={pendingCases.length > 0 ? 'Complete pending approval reviews before starting a new case.' : undefined}
                    >
                      New case
                    </button>
                  </div>
                  {pendingCases.length > 0 ? (
                    <p className="mt-2 text-sm text-warning">New case is disabled because an approval review is pending.</p>
                  ) : null}
                  {saved ? <p className="mt-3 text-sm text-success">Stored. Review the same file again to see the new advice.</p> : null}
                  {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
    <div className="printable-checklist hidden">
      <h1>{text.title}</h1>
      <p>{patient.procedure} · {hospital.name}, {hospital.city}</p>
      <ul>
        {patientDocuments(language).map((label, index) => {
          const present = [
            documents.preAuthorizationForm,
            documents.insurerCard,
            documents.identityProof !== 'missing',
            documents.policyCopy,
            documents.admissionAdvice,
            documents.investigationReports,
            documents.fitnessCertificate,
            documents.signedSurgicalConsent,
            documents.itemisedEstimate,
            packageAligned,
            !accidentCase || documents.mlcFir,
          ][index]
          const applicable = index !== 10 || accidentCase
          return applicable ? <li key={label}>{present ? '☑' : '☐'} {label}</li> : null
        })}
      </ul>
      <p>{text.advice}</p>
    </div>
    </>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm', checked ? 'text-ink-foreground' : 'text-ink-muted')}>
      <input type="checkbox" checked={checked} onChange={() => onChange(!checked)} className="size-4 accent-[oklch(0.6_0.13_162)]" />
      {label}
    </label>
  )
}

function parsePatientTokenCase(value: unknown): PatientTokenCase | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<PatientTokenCase>
  const docs = candidate.documents
  if (
    typeof candidate.hospitalId !== 'string' ||
    typeof candidate.payerId !== 'string' ||
    typeof candidate.procedure !== 'string' ||
    typeof candidate.packageName !== 'string' ||
    typeof candidate.packageCode !== 'string' ||
    typeof candidate.accidentCase !== 'boolean' ||
    !docs ||
    typeof docs.preAuthorizationForm !== 'boolean' ||
    typeof docs.insurerCard !== 'boolean' ||
    !['aadhaar', 'pan', 'voter-id', 'missing'].includes(docs.identityProof) ||
    typeof docs.policyCopy !== 'boolean' ||
    typeof docs.admissionAdvice !== 'boolean' ||
    typeof docs.investigationReports !== 'boolean' ||
    typeof docs.investigationReportsOnLetterheadAndDated !== 'boolean' ||
    typeof docs.investigationReportsMatchDiagnosis !== 'boolean' ||
    typeof docs.cbcAttached !== 'boolean' ||
    typeof docs.fitnessCertificate !== 'boolean' ||
    typeof docs.fitnessCertificateAgeDays !== 'number' ||
    typeof docs.signedSurgicalConsent !== 'boolean' ||
    typeof docs.itemisedEstimate !== 'boolean' ||
    typeof docs.mlcFir !== 'boolean'
  ) return null
  return candidate as PatientTokenCase
}
