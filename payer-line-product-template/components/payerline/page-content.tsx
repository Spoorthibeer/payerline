'use client'

import { useState } from 'react'
import { CtaFooter } from './cta-footer'
import { Hero } from './hero'
import { HowItWorks } from './how-it-works'
import { InsurerTicker } from './insurer-ticker'
import { KnowledgeSection } from './knowledge-section'
import { LiveDemo } from './live-demo'
import { Metrics } from './metrics'
import { PatientIntake } from './patient-intake'
import { SiteHeader } from './site-header'
import { PatientMode } from './patient-mode'
import { usePatient } from './patient-context'
import { patientText } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export function PageContent() {
  const { mode, language } = usePatient()
  const [deskUnlocked, setDeskUnlocked] = useState(false)
  const text = patientText[language]

  return (
    <>
      <SiteHeader />
      {mode === 'patient' ? (
        <PatientMode language={language} />
      ) : deskUnlocked ? (
        <>
          <main>
            <Hero />
            <InsurerTicker />
            <PatientIntake />
            <LiveDemo />
            <HowItWorks />
            <KnowledgeSection />
            <Metrics />
          </main>
          <CtaFooter />
        </>
      ) : (
        <>
          <main className="mx-auto max-w-lg px-4 py-20">
            <form
              className="rounded-2xl border bg-card p-6 shadow-[0_20px_60px_-30px_oklch(0.22_0.035_258/0.25)]"
              onSubmit={(event) => {
                event.preventDefault()
                void unlockDesk(new FormData(event.currentTarget).get('pin'), setDeskUnlocked)
              }}
            >
              <h1 className="font-serif text-3xl">{text.deskMode}</h1>
              <p className="mt-3 text-sm text-muted-foreground">{text.pinPrompt}</p>
              <label className="mt-5 block">
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{text.pinLabel}</span>
                <input name="pin" inputMode="numeric" autoComplete="current-password" required className="mt-2 h-12 w-full rounded-xl border bg-background px-4 text-sm" />
              </label>
              <button className={cn('mt-4 h-11 rounded-xl bg-success px-5 text-sm font-medium text-success-foreground')}>{text.unlock}</button>
              <p id="desk-pin-error" role="alert" className="mt-3 hidden text-sm text-destructive" />
              <p className="mt-5 border-t pt-4 text-sm text-muted-foreground">{text.advice}</p>
            </form>
          </main>
          <footer className="pb-8 text-center text-xs text-muted-foreground">{text.fictional}</footer>
        </>
      )}
    </>
  )
}

async function unlockDesk(pin: FormDataEntryValue | null, onSuccess: (unlocked: boolean) => void) {
  const errorElement = document.getElementById('desk-pin-error')
  if (!(errorElement instanceof HTMLParagraphElement)) return
  errorElement.classList.add('hidden')
  try {
    const response = await fetch('/api/desk-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: typeof pin === 'string' ? pin : '' }),
    })
    const body: unknown = await response.json()
    if (!response.ok) {
      const message = body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : 'Could not open desk mode.'
      throw new Error(message)
    }
    onSuccess(true)
  } catch (error) {
    errorElement.textContent = error instanceof Error ? error.message : 'Could not open desk mode.'
    errorElement.classList.remove('hidden')
  }
}
