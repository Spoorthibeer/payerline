'use client'

import { createContext, useContext, useState } from 'react'
import { patient as demoPatient, type Gender } from './data'

export type PatientFile = {
  name: string
  age: number
  gender: Gender | ''
  mrn: string
  ward: string
  scheduledAt: string
  diagnosis: string
  procedure: string
}

const examplePatient: PatientFile = {
  name: demoPatient.name,
  age: demoPatient.age,
  gender: demoPatient.gender,
  mrn: demoPatient.mrn,
  ward: demoPatient.ward,
  scheduledAt: demoPatient.scheduledAt,
  diagnosis: demoPatient.diagnosis,
  procedure: demoPatient.procedure,
}

const PatientContext = createContext<{
  patient: PatientFile
  setPatient: (patient: PatientFile) => void
} | null>(null)

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [patient, setPatient] = useState<PatientFile>(examplePatient)
  return <PatientContext.Provider value={{ patient, setPatient }}>{children}</PatientContext.Provider>
}

export function usePatient() {
  const value = useContext(PatientContext)
  if (!value) throw new Error('Patient details are only available inside the desk.')
  return value
}
