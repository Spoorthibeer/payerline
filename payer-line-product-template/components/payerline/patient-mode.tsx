'use client'

import { useMemo, useState } from 'react'
import type { AdmissionCase, DocumentChecklist, PatientTokenCase, ReviewResponse } from '@shared/types'
import { HOSPITALS, PROCEDURES } from '@shared/catalog'
import { PAYERS } from '@shared/payers'
import { patientMissingLabel, patientText, type Language } from '@/lib/i18n'
import { cn } from '@/lib/utils'

const emptyDocuments: DocumentChecklist = {
  preAuthorizationForm: false,
  insurerCard: false,
  identityProof: 'missing',
  policyCopy: false,
  admissionAdvice: false,
  investigationReports: false,
  investigationReportsOnLetterheadAndDated: false,
  investigationReportsMatchDiagnosis: false,
  cbcAttached: false,
  fitnessCertificate: false,
  fitnessCertificateAgeDays: 0,
  signedSurgicalConsent: false,
  itemisedEstimate: false,
  mlcFir: false,
}

const documentKeys = [
  'preAuthorizationForm',
  'insurerCard',
  'identityProof',
  'policyCopy',
  'admissionAdvice',
  'investigationReports',
  'fitnessCertificate',
  'signedSurgicalConsent',
  'itemisedEstimate',
  'package',
  'mlcFir',
] as const

export function PatientMode({ language }: { language: Language }) {
  const text = patientText[language]
  const [hospitalId, setHospitalId] = useState(HOSPITALS[0].id)
  const [payerId, setPayerId] = useState(PAYERS[0].id)
  const [procedureName, setProcedureName] = useState<string>(PROCEDURES[0].name)
  const [documents, setDocuments] = useState<DocumentChecklist>(emptyDocuments)
  const [accidentCase, setAccidentCase] = useState(false)
  const [review, setReview] = useState<ReviewResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [error, setError] = useState('')
  const procedure = PROCEDURES.find((item) => item.name === procedureName) ?? PROCEDURES[0]
  const missing = review?.checklist.fixes.map((item) => patientMissingLabel(language, item, procedure.name)) ?? []
  const checklistCase = useMemo<PatientTokenCase>(() => ({
    hospitalId,
    payerId,
    procedure: procedure.name,
    packageName: procedure.name,
    packageCode: procedure.packageCode,
    accidentCase,
    documents,
  }), [hospitalId, payerId, procedure, accidentCase, documents])

  const admission = (): AdmissionCase => ({
    patientName: 'Patient',
    age: 0,
    gender: '',
    mrn: '',
    ward: '',
    scheduledAt: '',
    hospitalId: checklistCase.hospitalId,
    diagnosis: '',
    procedure: checklistCase.procedure,
    payerId: checklistCase.payerId,
    packageName: checklistCase.packageName,
    packageCode: checklistCase.packageCode,
    accidentCase: checklistCase.accidentCase,
    documents: checklistCase.documents,
    clinicalNote: '',
  })

  const updateDocument = (key: (typeof documentKeys)[number], checked: boolean) => {
    setReview(null)
    setToken('')
    setDocuments((current) => {
      switch (key) {
        case 'preAuthorizationForm': return { ...current, preAuthorizationForm: checked }
        case 'insurerCard': return { ...current, insurerCard: checked }
        case 'identityProof': return { ...current, identityProof: checked ? 'aadhaar' : 'missing' }
        case 'policyCopy': return { ...current, policyCopy: checked }
        case 'admissionAdvice': return { ...current, admissionAdvice: checked }
        case 'investigationReports':
          return {
            ...current,
            investigationReports: checked,
            investigationReportsOnLetterheadAndDated: checked,
            investigationReportsMatchDiagnosis: checked,
            cbcAttached: checked,
          }
        case 'fitnessCertificate':
          return { ...current, fitnessCertificate: checked, fitnessCertificateAgeDays: checked ? 5 : 0 }
        case 'signedSurgicalConsent': return { ...current, signedSurgicalConsent: checked }
        case 'itemisedEstimate': return { ...current, itemisedEstimate: checked }
        case 'package': return current
        case 'mlcFir': return { ...current, mlcFir: checked }
      }
    })
  }

  const checkDocuments = async () => {
    setLoading(true)
    setError('')
    setReview(null)
    setToken('')
    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(admission()),
      })
      const body: unknown = await response.json()
      if (!response.ok) {
        const message = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
          ? body.error
          : text.reviewError
        throw new Error(message)
      }
      setReview(body as ReviewResponse)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : text.reviewError)
    } finally {
      setLoading(false)
    }
  }

  const createToken = async () => {
    setTokenError('')
    try {
      const response = await fetch('/api/patient-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checklistCase),
      })
      const body: unknown = await response.json()
      if (!response.ok) {
        const message = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
          ? body.error
          : text.tokenError
        throw new Error(message)
      }
      if (!body || typeof body !== 'object' || !('token' in body) || typeof body.token !== 'string') {
        throw new Error(text.tokenError)
      }
      setToken(body.token)
    } catch (caught) {
      setTokenError(caught instanceof Error ? caught.message : text.tokenError)
    }
  }

  const shareText = [
    text.shareIntro,
    ...missing.map((item) => `• ${item}`),
  ].join('\n')

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 md:px-8 md:py-20">
      <section className="rounded-2xl border bg-card p-6 shadow-[0_20px_60px_-30px_oklch(0.22_0.035_258/0.25)] md:p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-success">PayerLine</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">{text.title}</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{text.intro}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Select label={text.hospital} value={hospitalId} onChange={(value) => { setHospitalId(value as typeof hospitalId); setReview(null); setToken('') }}>
            {HOSPITALS.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name} ({hospital.city})</option>)}
          </Select>
          <Select label={text.insurer} value={payerId} onChange={(value) => { setPayerId(value as typeof payerId); setReview(null); setToken('') }}>
            {PAYERS.map((payer) => <option key={payer.id} value={payer.id}>{payer.name}</option>)}
          </Select>
          <Select label={text.surgery} value={procedureName} onChange={(value) => { setProcedureName(value); setReview(null); setToken('') }}>
            {PROCEDURES.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
          </Select>
        </div>

        <fieldset className="mt-8">
          <legend className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{text.documents}</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {documentKeys.filter((key) => key !== 'mlcFir' || accidentCase).map((key) => {
              const index = documentKeys.indexOf(key)
              const checked = key === 'package' || (
                key === 'identityProof'
                  ? documents.identityProof !== 'missing'
                  : Boolean(documents[key as keyof DocumentChecklist])
              )
              return (
                <label key={key} className={cn('flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm', checked ? 'border-success/50 bg-success/5' : 'border-border')}>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={key === 'package'}
                    onChange={(event) => updateDocument(key, event.target.checked)}
                    className="mt-0.5 size-4 accent-[oklch(0.6_0.13_162)]"
                  />
                  <span><span aria-hidden="true">📄 </span>{text.documentLabels[index]}</span>
                </label>
              )
            })}
          </div>
          <label className="mt-3 inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm">
            <input type="checkbox" checked={accidentCase} onChange={(event) => { setAccidentCase(event.target.checked); setReview(null); setToken('') }} className="size-4 accent-[oklch(0.6_0.13_162)]" />
            {text.accident}
          </label>
        </fieldset>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={() => void checkDocuments()} disabled={loading} className="inline-flex h-11 items-center justify-center rounded-xl bg-success px-5 text-sm font-medium text-success-foreground disabled:opacity-50">
            {loading ? text.checking : text.check}
          </button>
          <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm">
            {text.share}
          </a>
          {review ? <button type="button" onClick={() => window.print()} className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm">{text.print}</button> : null}
        </div>

        {error ? <p role="alert" className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p> : null}
        {review ? (
          <div className="mt-6 rounded-xl border border-ink-border bg-ink/[0.03] p-5">
            <h2 className="text-xl font-semibold">{missing.length === 0 ? text.ready : text.missing(missing.length)}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{missing.length === 0 ? text.noMissing : text.bring}</p>
            {missing.length > 0 ? <ul className="mt-2 list-inside list-disc space-y-1 text-sm">{missing.map((item) => <li key={item}>{item}</li>)}</ul> : null}
            <p className="mt-5 text-sm text-muted-foreground">{text.tokenOptional}</p>
            <button type="button" onClick={() => void createToken()} className="mt-3 rounded-xl border px-4 py-2.5 text-sm">{text.createToken}</button>
            {token ? <p className="mt-4 text-sm">{text.tokenReady}<span className="ml-2 rounded-md bg-success/10 px-2 py-1 font-mono text-xl font-semibold tracking-[0.25em] text-success">{token}</span><span className="mt-2 block text-xs text-muted-foreground">{text.tokenExpiry}</span></p> : null}
            {tokenError ? <p role="alert" className="mt-3 text-sm text-destructive">{tokenError}</p> : null}
          </div>
        ) : null}

        <p className="mt-8 border-t pt-5 text-sm text-muted-foreground">{text.advice}</p>
      </section>

      <div className="printable-checklist hidden">
        <h1>{text.title}</h1>
        <p>{text.surgery}: {procedure.name}</p>
        <h2>{text.shareIntro}</h2>
        {missing.length > 0
          ? <ul>{missing.map((item) => <li key={item}>☐ {item}</li>)}</ul>
          : <p>{text.noMissing}</p>}
        <p>{text.advice}</p>
      </div>
      <footer className="mt-6 text-center text-xs text-muted-foreground">
        <p>{text.advice}</p>
        <p className="mt-1">{text.fictional}</p>
      </footer>
    </main>
  )
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-12 w-full rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {children}
      </select>
    </label>
  )
}
