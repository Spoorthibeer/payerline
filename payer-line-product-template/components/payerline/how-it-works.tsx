import { BookOpenCheck, FileSearch, MessageSquareWarning } from 'lucide-react'
import { Reveal } from './reveal'

const steps = [
  {
    icon: BookOpenCheck,
    n: '01',
    title: 'Retain each insurer separately',
    body: 'Approvals, queries, and denials for this cholecystectomy are written into that insurer’s Hindsight bank. Meridian never sees Northline’s facts.',
    detail: ['One bank per insurer', 'Dated outcomes', 'Written policy kept beside them'],
  },
  {
    icon: FileSearch,
    n: '02',
    title: 'Recall only that bank',
    body: 'Today’s packet is compared with what this insurer actually did: letterhead, package name, culture, labs, and the age of the fitness note.',
    detail: ['Same surgery', 'Opposite documents', 'Citations stay visible'],
  },
  {
    icon: MessageSquareWarning,
    n: '03',
    title: 'Reflect, then a person sends',
    body: 'The desk gets hold or send, the fixes, and the documents to leave out. If policy and outcomes disagree, outcomes govern. The agent does not diagnose or submit.',
    detail: ['Hold or send', 'Fixes and do-not-add', 'New replies are retained'],
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-24 md:px-8 md:py-32">
      <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-success">How it works</p>
          <h2 className="mt-4 text-balance font-serif text-4xl leading-tight md:text-6xl">
            Retain. Recall. Reflect. Then the desk decides.
          </h2>
        </div>
        <p className="max-w-sm text-pretty text-muted-foreground">
          One procedure at St. Brigid Memorial. Two insurers. The advice changes when the bank changes.
        </p>
      </Reveal>

      <ol className="mt-14 grid gap-6 md:grid-cols-3">
        {steps.map((step, i) => (
          <Reveal
            as="li"
            key={step.n}
            delay={i * 120}
            className="group relative flex flex-col rounded-2xl border bg-card p-7 transition-shadow hover:shadow-[0_20px_50px_-25px_oklch(0.22_0.035_258/0.35)]"
          >
            <div className="flex items-center justify-between">
              <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-transform group-hover:-rotate-6">
                <step.icon className="size-5" aria-hidden="true" />
              </span>
              <span className="font-serif text-5xl text-muted-foreground/30">{step.n}</span>
            </div>
            <h3 className="mt-8 text-xl font-semibold tracking-tight">{step.title}</h3>
            <p className="mt-3 flex-1 text-pretty leading-relaxed text-muted-foreground">{step.body}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {step.detail.map((d) => (
                <li key={d} className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                  {d}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </ol>
    </section>
  )
}
