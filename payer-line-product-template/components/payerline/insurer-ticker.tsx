import { tickerItems } from './data'

export function InsurerTicker() {
  const items = [...tickerItems, ...tickerItems]
  return (
    <section aria-label="Recently learned insurer rules" className="border-y bg-ink py-4 text-ink-foreground">
      <div className="flex items-center gap-6">
        <p className="relative z-10 hidden shrink-0 bg-ink pl-8 pr-4 font-mono text-xs uppercase tracking-widest text-ink-muted md:block">
          Held in memory
        </p>
        <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <ul className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused]">
            {items.map((item, i) => (
              <li key={i} aria-hidden={i >= tickerItems.length} className="flex shrink-0 items-center gap-3 text-sm">
                <span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />
                <span className="font-medium">{item.insurer}</span>
                <span className="text-ink-muted">{item.rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
