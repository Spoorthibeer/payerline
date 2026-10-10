'use client'

import { useEffect, useRef, useState } from 'react'

const metrics = [
  { value: 4, suffix: '', prefix: '', label: 'insurer banks, never mixed' },
  { value: 21, suffix: '', prefix: '', label: 'seeded outcomes for this surgery' },
  { value: 1, suffix: '', prefix: '', label: 'procedure: laparoscopic cholecystectomy' },
  { value: 14, suffix: 'd', prefix: '', label: 'Northline fitness-note limit' },
]

function CountUp({ to, decimals = 0, start }: { to: number; decimals?: number; start: boolean }) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!start) return
    let frame = 0
    const began = performance.now()
    const duration = 1600
    const tick = (now: number) => {
      const t = Math.min(1, (now - began) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(to * eased)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [start, to])

  return <>{value.toFixed(decimals)}</>
}

export function Metrics() {
  const ref = useRef<HTMLElement>(null)
  const [start, setStart] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStart(true)
        observer.disconnect()
      }
    }, { threshold: 0.3 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} aria-labelledby="metrics-heading" className="mx-auto max-w-7xl px-4 py-24 md:px-8">
      <h2 id="metrics-heading" className="sr-only">Results</h2>
      <dl className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-card p-8">
            <dd className="font-serif text-5xl tabular-nums md:text-6xl">
              <span className="font-sans text-4xl text-muted-foreground md:text-5xl">{m.prefix}</span>
              <CountUp to={m.value} start={start} />
              <span className="ml-1 text-2xl text-muted-foreground md:text-3xl">{m.suffix}</span>
            </dd>
            <dt className="mt-3 text-sm text-muted-foreground">{m.label}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">Counts from the seeded cholecystectomy history. Advice still comes from live recall and reflect.</p>
    </section>
  )
}
