import { CtaFooter } from '@/components/payerline/cta-footer'
import { Hero } from '@/components/payerline/hero'
import { HowItWorks } from '@/components/payerline/how-it-works'
import { InsurerTicker } from '@/components/payerline/insurer-ticker'
import { KnowledgeSection } from '@/components/payerline/knowledge-section'
import { LiveDemo } from '@/components/payerline/live-demo'
import { Metrics } from '@/components/payerline/metrics'
import { PatientIntake } from '@/components/payerline/patient-intake'
import { PatientProvider } from '@/components/payerline/patient-context'
import { SiteHeader } from '@/components/payerline/site-header'

export default function Page() {
  return (
    <PatientProvider>
      <SiteHeader />
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
    </PatientProvider>
  )
}
