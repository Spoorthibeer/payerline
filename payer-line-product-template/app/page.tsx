import { PageContent } from '@/components/payerline/page-content'
import { PatientProvider } from '@/components/payerline/patient-context'

export default function Page() {
  return (
    <PatientProvider>
      <PageContent />
    </PatientProvider>
  )
}
