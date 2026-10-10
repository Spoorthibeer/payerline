'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Check, FileText, Loader2, Send, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePatient } from './patient-context'

type Step = { label: string; outcome: 'pass' | 'flag'; note?: string }

const steps: Step[] = [
  { label: 'Clinical note and package name are on the form', outcome: 'pass' },
  { label: 'Written policy would accept this packet', outcome: 'pass' },
  {
    label: 'Package name does not match the procedure',
    outcome: 'flag',
    note: 'Some insurers deny “management”. The package must match the procedure entered on the file.',
  },
  {
    label: 'Required papers differ by insurer bank',
    outcome: 'flag',
    note: 'Meridian, Northline, Harbour, and Sable each keep separate memory. Open only one bank.',
  },
  {
    label: 'A conflicting report is still in the packet',
    outcome: 'flag',
    note: 'Past outcomes may ask you to leave that document out before send.',
  },
]

const STEP_MS = 900
const START_SECONDS = 58 * 60 + 12

function formatCountdown(total: number) {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `00:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function PreflightCard() {
  const { patient } = usePatient()
  const genderMark = patient.gender === 'Female' ? 'F' : patient.gender === 'Male' ? 'M' : ''
  const [active, setActive] = useState(0)
  const [seconds, setSeconds] = useState(START_SECONDS)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const id = setInterval(() => {
      setActive((current) => (current >= steps.length + 6 ? 0 : current + 1))
    }, STEP_MS)
    return () => clearInterval(id)
  }, [])

  const fixed = mounted && active >= steps.length + 2

  useEffect(() => {
    if (!mounted) return
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : START_SECONDS)), 1000)
    return () => clearInterval(id)
  }, [mounted])

  const done = mounted && active >= steps.length
  const checked = mounted ? Math.min(active, steps.length) : 0
  const score = fixed ? 96 : done ? 71 : Math.round((checked / steps.length) * 68)
  const circumference = 2 * Math.PI * 26

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-accent via-transparent to-warning/20 blur-2xl"
      />
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-[0_30px_80px_-30px_oklch(0.22_0.035_258/0.35)]">
        <div className="flex items-center justify-between border-b bg-secondary/60 px-5 py-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="size-3.5" aria-hidden="true" />
            <span className="font-mono">CASHLESS · {patient.mrn || '—'}</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-warning/15 px-2.5 py-1 font-mono text-xs text-warning-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-warning" aria-hidden="true" />
            <span className="sr-only">Insurer turnaround remaining:</span>
            <span className="tabular-nums">{formatCountdown(seconds)}</span>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Patient · {patient.ward || 'Admission'}
            </p>
            <p className="mt-1 text-lg font-semibold">{`${patient.name || 'Patient not entered'}, ${patient.age || '—'}${genderMark}`}</p>
            <p className="text-sm text-muted-foreground">{patient.diagnosis || 'Diagnosis not entered'}</p>
            <p className="text-sm text-muted-foreground">{patient.procedure || 'Procedure not entered'}</p>
          </div>
          <div className="relative size-16 shrink-0" role="img" aria-label={`Checks cleared ${score} of 100`}>
            <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
              <circle cx="32" cy="32" r="26" fill="none" strokeWidth="5" className="stroke-muted" />
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (score / 100) * circumference}
                className={cn(
                  'transition-all duration-700',
                  fixed ? 'stroke-success' : done ? 'stroke-warning' : 'stroke-primary',
                )}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-semibold tabular-nums">
              {score}
            </span>
          </div>
        </div>

        <div className="relative mx-5 mt-5 overflow-hidden rounded-xl border bg-background">
          {!done && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 h-10 animate-scan bg-gradient-to-b from-transparent via-success/15 to-transparent"
            />
          )}
          <ul className="divide-y" aria-live="polite">
            {steps.map((step, i) => {
              const state = i < active ? step.outcome : i === active ? 'checking' : 'pending'
              const isFlag = state === 'flag'
              const resolved = isFlag && fixed
              return (
                <li key={step.label} className="px-4 py-2.5">
                  <div className="flex items-center gap-3 text-sm">
                    <span
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full transition-colors',
                        state === 'pending' && 'border border-dashed border-muted-foreground/40',
                        state === 'checking' && 'text-primary',
                        (state === 'pass' || resolved) && 'bg-success text-success-foreground',
                        isFlag && !resolved && 'bg-warning text-warning-foreground',
                      )}
                    >
                      {state === 'checking' && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
                      {(state === 'pass' || resolved) && <Check className="size-3" aria-hidden="true" />}
                      {isFlag && !resolved && <AlertTriangle className="size-3" aria-hidden="true" />}
                    </span>
                    <span
                      className={cn(
                        'transition-colors',
                        state === 'pending' ? 'text-muted-foreground/60' : 'text-foreground',
                        resolved && 'line-through decoration-success/60',
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {isFlag && step.note && (
                    <p
                      className={cn(
                        'ml-8 mt-1.5 rounded-md px-2.5 py-1.5 text-xs leading-relaxed animate-in fade-in slide-in-from-top-1',
                        resolved ? 'bg-accent text-accent-foreground' : 'bg-warning/15 text-warning-foreground',
                      )}
                    >
                      {resolved ? 'Corrected on the desk before the file left' : step.note}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <p className="text-xs text-muted-foreground">
            {fixed ? 'Packet cleared against the open insurer bank' : done ? 'Past outcomes would hold this file' : 'Recalling the selected insurer bank…'}
          </p>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              fixed ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground',
            )}
          >
            {fixed ? <Send className="size-3.5" aria-hidden="true" /> : <ShieldCheck className="size-3.5" aria-hidden="true" />}
            {fixed ? 'Send to insurer' : 'Hold file'}
          </span>
        </div>
      </div>

      <div className="absolute -bottom-10 -left-12 hidden animate-float rounded-xl border bg-card px-4 py-3 shadow-lg xl:block">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Insurer bank</p>
        <p className="font-serif text-2xl">Memory</p>
        <p className="text-xs text-muted-foreground">one bank open at a time</p>
      </div>
    </div>
  )
}
