'use client'

import { ArrowRight } from 'lucide-react'
import { Logo } from './logo'
import { usePatient } from './patient-context'

export function CtaFooter() {
  const { patient } = usePatient()
  const reviewLabel = patient.name.trim()
    ? `Review ${patient.name.trim()}'s file`
    : 'Review this file'

  return (
    <footer id="pilot" className="scroll-mt-16 bg-ink text-ink-foreground">
      <div className="relative mx-auto max-w-7xl overflow-hidden px-4 pb-12 pt-24 md:px-8 md:pt-32">
        <div aria-hidden="true" className="absolute inset-0 bg-grid-ink [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-success">St. Brigid Memorial</p>
          <h2 className="mt-4 text-balance font-serif text-5xl leading-tight md:text-7xl">
            Hold the file the policy would send.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-ink-muted">
            Open Meridian first. The default packet should hold. Switch to Northline and the same surgery asks for
            different papers. A person still sends the file.
          </p>
          <a
            href="#demo"
            className="mx-auto mt-10 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-success px-5 text-sm font-medium text-success-foreground transition-all hover:brightness-110"
          >
            {reviewLabel}
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
        </div>

        <div className="relative mt-24 flex flex-col items-start justify-between gap-6 border-t border-ink-border pt-8 text-sm text-ink-muted md:flex-row md:items-center">
          <Logo inverted />
          <p>Advice only. The cashless desk still sends the file.</p>
          <p className="font-mono text-xs">© 2026 PayerLine</p>
        </div>
      </div>
    </footer>
  )
}
