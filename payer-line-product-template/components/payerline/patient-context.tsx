'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { HospitalId } from '@shared/types'
import type { Language } from '@/lib/i18n'
import { patient as demoPatient, type Gender } from './data'

export type PatientFile = {
  name: string
  age: number
  gender: Gender | ''
  mrn: string
  ward: string
  scheduledAt: string
  hospitalId: HospitalId
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
  hospitalId: demoPatient.hospitalId,
  diagnosis: demoPatient.diagnosis,
  procedure: demoPatient.procedure,
}

const PatientContext = createContext<{
  patient: PatientFile
  setPatient: (patient: PatientFile) => void
  mode: 'patient' | 'desk'
  setMode: (mode: 'patient' | 'desk') => void
  language: Language
  setLanguage: (language: Language) => void
} | null>(null)

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [patient, setPatient] = useState<PatientFile>(examplePatient)
  const [mode, setModeState] = useState<'patient' | 'desk'>('desk')
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    try {
      const savedMode = window.localStorage.getItem('payerline-mode')
      if (savedMode === 'patient' || savedMode === 'desk') setModeState(savedMode)
      const savedLanguage = window.localStorage.getItem('payerline-language')
      if (savedLanguage === 'en' || savedLanguage === 'hi' || savedLanguage === 'te') setLanguageState(savedLanguage)
    } catch {
      // Keep the default preferences when browser storage is unavailable.
    }
  }, [])

  const setMode = (nextMode: 'patient' | 'desk') => {
    setModeState(nextMode)
    try {
      window.localStorage.setItem('payerline-mode', nextMode)
    } catch {
      // The mode remains usable for this visit if browser storage is unavailable.
    }
  }
  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage)
    try {
      window.localStorage.setItem('payerline-language', nextLanguage)
    } catch {
      // The language remains usable for this visit if browser storage is unavailable.
    }
  }

  return (
    <PatientContext.Provider value={{ patient, setPatient, mode, setMode, language, setLanguage }}>
      {children}
    </PatientContext.Provider>
  )
}

export function usePatient() {
  const value = useContext(PatientContext)
  if (!value) throw new Error('Patient details are only available inside the desk.')
  return value
}
