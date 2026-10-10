import { ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PreflightCard } from './preflight-card'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 pb-20 pt-16 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-24">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">St. Brigid</span>
            Cashless desk · four insurer banks, one packet at a time
          </p>
          <h1 className="mt-6 text-balance font-serif text-5xl leading-[1.02] tracking-tight md:text-7xl">
            The policy says send. <em className="text-success">Memory</em> may say hold.
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            PayerLine reviews today&apos;s cashless file against one insurer at a time. Meridian, Northline, Harbour,
            and Sable each keep a separate Hindsight bank, because the same surgery can need opposite papers.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#demo" className={cn(buttonVariants({ size: 'lg' }), 'h-11 px-5 text-sm')}>
              Review a live file
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </a>
            <a href="#patient" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-11 px-5 text-sm')}>
              Enter the patient
            </a>
          </div>
          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t pt-6">
            <div>
              <dt className="text-xs text-muted-foreground">Insurer banks</dt>
              <dd className="mt-1 font-serif text-3xl">4</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Decision</dt>
              <dd className="mt-1 font-serif text-3xl text-success">Hold / Send</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Banks mix?</dt>
              <dd className="mt-1 font-serif text-3xl">Never</dd>
            </div>
          </dl>
        </div>
        <PreflightCard />
      </div>
    </section>
  )
}
