'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, CircleSlash, Loader2, ScanLine, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { payers } from './data'
import { usePatient } from './patient-context'

type PayerId = (typeof payers)[number]['id']
type Phase = 'idle' | 'scanning' | 'done' | 'error'

type Evidence = { id: string; text: string; type?: string; occurred?: string }

type Review = {
  decision: {
    decision: 'hold' | 'send'
    confidence: 'thin' | 'moderate' | 'strong'
    policyConflict: boolean
    summary: string
    fixes: string[]
    doNotAdd: string[]
    basedOn: Evidence[]
  }
  recalled: Evidence[]
  outcomes?: Evidence[]
  bankId: string
}

export function LiveDemo() {
  const [payerId, setPayerId] = useState<PayerId>('meridian')
  const [packageName, setPackageName] = useState('management')
  const [letterhead, setLetterhead] = useState(false)
  const [cultureAttached, setCultureAttached] = useState(true)
  const [cultureConflicts, setCultureConflicts] = useState(true)
  const [fitnessAttached, setFitnessAttached] = useState(false)
  const [fitnessAge, setFitnessAge] = useState(21)
  const [consentAttached, setConsentAttached] = useState(false)
  const [itemisedEstimate, setItemisedEstimate] = useState(false)
  const [photoIdAttached, setPhotoIdAttached] = useState(false)
  const [policyCardAttached, setPolicyCardAttached] = useState(false)
  const [cbcAttached, setCbcAttached] = useState(false)
  const { patient } = usePatient()
  const [phase, setPhase] = useState<Phase>('idle')
  const [review, setReview] = useState<Review | null>(null)
  const [error, setError] = useState('')
  const [outcome, setOutcome] = useState<'approved' | 'queried' | 'denied'>('denied')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')

  const payer = payers.find((item) => item.id === payerId)!
  const procedureName = patient.procedure.trim()
  const packageOptions = useMemo(() => {
    const options = ['management']
    if (procedureName && procedureName.toLowerCase() !== 'management') options.push(procedureName)
    return options
  }, [procedureName])

  const reset = () => {
    setPhase('idle')
    setReview(null)
    setError('')
    setSaved('')
  }

  useEffect(() => {
    if (!packageOptions.includes(packageName)) {
      setPackageName('management')
      reset()
    }
  }, [packageOptions, packageName])

  const admission = {
    patientName: patient.name,
    age: patient.age,
    gender: patient.gender,
    mrn: patient.mrn,
    ward: patient.ward,
    scheduledAt: patient.scheduledAt,
    diagnosis: patient.diagnosis,
    procedure: patient.procedure,
    payerId,
    packageName,
    ultrasoundAttached: true,
    ultrasoundDateOnLetterhead: letterhead,
    cultureReportAttached: cultureAttached,
    cultureContradictsDiagnosis: cultureAttached && cultureConflicts,
    fitnessCertificateAttached: fitnessAttached,
    fitnessCertificateAgeDays: fitnessAttached ? fitnessAge : 0,
    consentAttached,
    itemisedEstimateAttached: itemisedEstimate,
    photoIdAttached,
    policyCardAttached,
    cbcAttached,
    clinicalNote: `${patient.name}, ${patient.age}, ${patient.gender}, ${patient.procedure}, ${payer.name}. Package name: ${packageName}.`,
  }

  const run = async () => {
    if (!patient.name.trim() || !patient.procedure.trim()) {
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
        body: JSON.stringify(admission),
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

  const saveOutcome = async () => {
    if (!review || reason.trim().length < 8) return
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/outcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payerId,
          outcome,
          reason,
          caseSnapshot: { ...admission, clinicalNote: reason },
        }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'The outcome was not stored.')
      setSaved(body.documentId)
      setReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The outcome was not stored.')
    } finally {
      setSaving(false)
    }
  }

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
    <section id="demo" className="relative scroll-mt-16 overflow-hidden bg-ink py-24 text-ink-foreground md:py-32">
      <div aria-hidden="true" className="absolute inset-0 bg-grid-ink [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-success">Try it · live memory check</p>
          <h2 className="mt-4 text-balance font-serif text-4xl leading-tight md:text-6xl">
            Same surgery. Only one bank is opened.
          </h2>
          <p className="mt-5 max-w-2xl text-pretty text-lg text-ink-muted">
            {patient.name || 'The patient'} is booked for {patient.procedure || 'this procedure'} at St. Brigid Memorial. The check uses that
            insurer&apos;s Hindsight bank, not the written policy.
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

            <div className="mt-6">
              <label htmlFor="package" className="font-mono text-xs uppercase tracking-widest text-ink-muted">
                Package name on the form
              </label>
              <select
                id="package"
                value={packageName}
                onChange={(event) => {
                  setPackageName(event.target.value)
                  reset()
                }}
                className="mt-3 w-full rounded-xl border border-ink-border bg-ink px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-success/60"
              >
                {packageOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <fieldset className="mt-6">
              <legend className="font-mono text-xs uppercase tracking-widest text-ink-muted">What is in today&apos;s packet</legend>
              <div className="mt-3 grid gap-2">
                <Toggle label="Ultrasound date is on hospital letterhead" checked={letterhead} onChange={(value) => { setLetterhead(value); reset() }} />
                <Toggle label="Culture report is attached" checked={cultureAttached} onChange={(value) => { setCultureAttached(value); reset() }} />
                <Toggle label="Culture report conflicts with the diagnosis" checked={cultureConflicts} onChange={(value) => { setCultureConflicts(value); reset() }} />
                <Toggle label="Physician fitness certificate is attached" checked={fitnessAttached} onChange={(value) => { setFitnessAttached(value); reset() }} />
                <Toggle label="Signed surgical consent is attached" checked={consentAttached} onChange={(value) => { setConsentAttached(value); reset() }} />
                <Toggle label="Estimate is itemised" checked={itemisedEstimate} onChange={(value) => { setItemisedEstimate(value); reset() }} />
                <Toggle label="Photo identity is attached" checked={photoIdAttached} onChange={(value) => { setPhotoIdAttached(value); reset() }} />
                <Toggle label="Policy e-card is attached" checked={policyCardAttached} onChange={(value) => { setPolicyCardAttached(value); reset() }} />
                <Toggle label="CBC report is attached" checked={cbcAttached} onChange={(value) => { setCbcAttached(value); reset() }} />
              </div>
              {fitnessAttached ? (
                <label className="mt-3 flex items-center justify-between text-sm text-ink-muted">
                  Fitness note age (days)
                  <input
                    type="number"
                    min={0}
                    value={fitnessAge}
                    onChange={(event) => {
                      setFitnessAge(Number(event.target.value))
                      reset()
                    }}
                    className="w-20 rounded-lg border border-ink-border bg-ink px-3 py-2 text-ink-foreground"
                  />
                </label>
              ) : null}
            </fieldset>

            <button
              type="button"
              onClick={run}
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
                  {patient.name || 'Patient not entered'} · {payer.name}
                </p>
              </div>
              {review && phase === 'done' ? (
                <span className={cn('rounded-full px-3 py-1 font-mono text-xs uppercase tracking-widest', holding ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success')}>
                  {holding ? 'Hold' : 'Send'} · {review.decision.confidence}
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
                <div className={cn('rounded-xl px-4 py-3 text-sm', holding ? 'bg-destructive/15' : 'bg-success/15')}>
                  <div className="flex items-start gap-3">
                    {holding ? <CircleSlash className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" /> : <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />}
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="font-medium">{holding ? 'Hold — do not send this file.' : 'Send — packet is clear.'}</p>
                      <p className="text-ink-muted">{review.decision.summary}</p>
                    </div>
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
                      <button key={kind} type="button" onClick={() => setOutcome(kind)} className={cn('rounded-full border px-3 py-1 text-xs uppercase tracking-wider', outcome === kind ? 'border-success bg-success/15 text-success' : 'border-ink-border text-ink-muted')}>
                        {kind}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    rows={3}
                    required
                    placeholder="The insurer’s reason, in their words"
                    className="mt-3 w-full rounded-xl border border-ink-border bg-ink px-4 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-success/60"
                  />
                  <button type="submit" disabled={saving || reason.trim().length < 8} className="mt-3 inline-flex h-11 items-center justify-center rounded-xl border border-ink-border px-4 text-sm disabled:opacity-50">
                    {saving ? 'Writing into memory…' : 'Write outcome into this bank'}
                  </button>
                  {saved ? <p className="mt-3 text-sm text-success">Stored. Review the same file again to see the new advice.</p> : null}
                  {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
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
