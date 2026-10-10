'use client'

import { createContext, useContext, useState } from 'react'
import type { Gender } from './data'

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

const emptyPatient: PatientFile = {
  name: '',
  age: 0,
  gender: '',
  mrn: '',
  ward: '',
  scheduledAt: '',
  diagnosis: '',
  procedure: '',
}

const PatientContext = createContext<{
  patient: PatientFile
  setPatient: (patient: PatientFile) => void
} | null>(null)

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [patient, setPatient] = useState<PatientFile>(emptyPatient)
  return <PatientContext.Provider value={{ patient, setPatient }}>{children}</PatientContext.Provider>
}

export function usePatient() {
  const value = useContext(PatientContext)
  if (!value) throw new Error('Patient details are only available inside the desk.')
  return value
}
