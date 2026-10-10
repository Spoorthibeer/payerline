'use client'

import { useEffect, useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Logo } from './logo'

function LiveClock() {
  const [time, setTime] = useState('--:--:--')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const format = () =>
      new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata',
      })
    setTime(format())
    setReady(true)
    const id = setInterval(() => setTime(format()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="hidden items-center gap-2 rounded-full border bg-card px-3 py-1 font-mono text-xs text-muted-foreground md:inline-flex">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping-slow rounded-full bg-success" />
        <span className="relative inline-flex size-2 rounded-full bg-success" />
      </span>
      <span>Live</span>
      <span className="tabular-nums text-foreground" suppressHydrationWarning>
        {ready ? time : '--:--:--'}
      </span>
      <span>IST</span>
    </span>
  )
}

const links = [
  { href: '#patient', label: 'Patient' },
  { href: '#demo', label: 'Live check' },
  { href: '#how', label: 'How it works' },
  { href: '#knowledge', label: 'Knowledge' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 md:px-8">
        <a href="#" className="flex items-center gap-2" aria-label="PayerLine home">
          <Logo />
        </a>
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-8 text-sm text-muted-foreground">
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="transition-colors hover:text-foreground">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-3">
          <LiveClock />
          <a href="#demo" className={cn(buttonVariants({ size: 'sm' }))}>
            Review a file
          </a>
        </div>
      </div>
    </header>
  )
}
