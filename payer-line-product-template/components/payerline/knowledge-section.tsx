import { Quote } from 'lucide-react'
import { Reveal } from './reveal'

const notes = [
  { insurer: 'Bharat Arogya', text: 'Reports need dated hospital letterhead and the exact procedure package name.', uses: 'Simulated history' },
  { insurer: 'Suraksha General', text: 'Lab reports must match the diagnosis and the fitness note be under 14 days.', uses: 'Simulated history' },
  { insurer: 'Navjeevan TPA', text: 'Signed surgical consent and an itemised estimate matter.', uses: 'Simulated history' },
]

export function KnowledgeSection() {
  return (
    <section id="knowledge" className="scroll-mt-20 border-y bg-secondary/40">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-24 md:px-8 md:py-32 lg:grid-cols-2">
        <Reveal className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-ink text-ink-foreground">
            <div aria-hidden="true" className="absolute inset-0 bg-grid-ink opacity-70" />
            <div className="relative flex h-full flex-col p-7">
              <p className="font-mono text-[11px] uppercase tracking-widest text-success">Separate insurer memories</p>
              <h3 className="mt-3 font-serif text-3xl leading-tight">Laparoscopic cholecystectomy</h3>
              <p className="mt-2 text-sm text-ink-muted">Fictional case · Hyderabad</p>
              <div className="mt-8 grid flex-1 content-start gap-4">
                <article className="rounded-2xl border border-ink-border bg-white/[0.04] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-success">payerline-bharat-arogya</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    Letterhead dates and exact package name are important. The same package can be queried if its name does not match the surgery.
                  </p>
                </article>
                <article className="rounded-2xl border border-ink-border bg-white/[0.04] p-4">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-warning">payerline-suraksha-general</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    Matching laboratory reports and a fitness certificate dated within 14 days support approval.
                  </p>
                </article>
              </div>
              <p className="text-sm text-ink-muted">Facts are not copied from one bank into the other.</p>
            </div>
          </div>
          <ul className="mt-4 space-y-3 md:absolute md:-right-3 md:top-10 md:mt-0 md:w-72 lg:-right-10">
            {notes.map((note, i) => (
              <li
                key={note.text}
                className="animate-float rounded-xl border bg-card p-4 shadow-lg"
                style={{ animationDelay: `${i * 0.8}s` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-success">{note.insurer}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{note.uses}</span>
                </div>
                <p className="mt-1.5 text-sm leading-snug">{note.text}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={120}>
          <p className="font-mono text-xs uppercase tracking-widest text-success">Institutional memory</p>
          <h2 className="mt-4 text-balance font-serif text-4xl leading-tight md:text-6xl">
            What each insurer did, not what the policy says.
          </h2>
          <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
            The useful fact is a dated outcome: this packet was denied, queried, or approved. PayerLine keeps those
            facts in the insurer’s own bank and cites them when the next identical surgery arrives.
          </p>
          <figure className="mt-10 rounded-2xl border bg-card p-7">
            <Quote className="size-6 text-success" aria-hidden="true" />
            <blockquote className="mt-4 font-serif text-2xl leading-snug">
            &ldquo;A packet that looks complete can still be queried for one document fact. Keep the learning with the insurer that raised it.&rdquo;
            </blockquote>
            <figcaption className="mt-5 text-sm text-muted-foreground">
            Illustrative example · Bharat Arogya Insurance
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  )
}
