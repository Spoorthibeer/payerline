import type { HospitalId } from '@shared/types'

export type Gender = 'Female' | 'Male' | 'Other'

export const patient = {
  name: 'Demo patient',
  age: 46,
  gender: 'Female' as Gender,
  mrn: 'DEMO-44821',
  ward: 'Surgical admission',
  scheduledAt: 'Tomorrow, 07:40',
  hospitalId: 'sri-venkateswara-hyderabad' as HospitalId,
  diagnosis: 'Acute calculus cholecystitis',
  procedure: 'Laparoscopic cholecystectomy',
}

export const payers = [
  {
    id: 'bharat-arogya' as const,
    name: 'Bharat Arogya Insurance',
    deskCode: 'BAI-04',
    posture: 'Strict on reports dated on hospital letterhead and the exact package name.',
    writtenPolicy: [
      'Relevant reports must be dated on hospital letterhead.',
      'The package name must exactly match the procedure.',
      'Include the signed pre-authorisation and identity documents.',
    ],
  },
  {
    id: 'suraksha-general' as const,
    name: 'Suraksha General Insurance',
    deskCode: 'SGI-17',
    posture: 'Needs matching laboratory reports and a fitness certificate within 14 days.',
    writtenPolicy: [
      'Attach laboratory reports that match the diagnosis.',
      'Fitness certificate must be dated within 14 days.',
      'Include the signed pre-authorisation and identity documents.',
    ],
  },
  {
    id: 'navjeevan-health-tpa' as const,
    name: 'Navjeevan Health TPA',
    deskCode: 'NHT-22',
    posture: 'Needs signed surgical consent and a fully itemised estimate.',
    writtenPolicy: [
      'Attach patient-signed surgical consent.',
      'Provide an itemised estimate, not a lump sum.',
      'Include the signed pre-authorisation and identity documents.',
    ],
  },
  {
    id: 'jan-raksha-yojana' as const,
    name: 'Jan Raksha Yojana',
    deskCode: 'JRY-09',
    posture: 'Scheme-style checks focus on Aadhaar/e-KYC, its e-card, package code, and CBC.',
    writtenPolicy: [
      'Verify Aadhaar/e-KYC and attach the scheme e-card.',
      'Use the package code that matches the procedure.',
      'Attach a CBC report.',
    ],
  },
]

export const tickerItems = [
  { insurer: 'Bharat Arogya', rule: 'Report dates belong on hospital letterhead; package names must match exactly' },
  { insurer: 'Suraksha General', rule: 'Labs must match the diagnosis; fitness certificate must be within 14 days' },
  { insurer: 'Navjeevan Health TPA', rule: 'Surgical consent must be signed and the estimate itemised' },
  { insurer: 'Jan Raksha Yojana', rule: 'Aadhaar/e-KYC, scheme e-card, matching package code, and CBC' },
]
