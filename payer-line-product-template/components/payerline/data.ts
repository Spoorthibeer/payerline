export type Gender = 'Female' | 'Male' | 'Other'

export const patient = {
  name: 'Mrs. Ananya Rao',
  age: 46,
  gender: 'Female' as Gender,
  mrn: 'SB-44821',
  ward: 'Surgical admission',
  scheduledAt: 'Tomorrow, 07:40',
  diagnosis: 'Acute calculus cholecystitis',
  procedure: 'Laparoscopic cholecystectomy',
}

export const payers = [
  {
    id: 'meridian' as const,
    name: 'Meridian Health Assurance',
    deskCode: 'MHA-04',
    tat: 'before noon',
    posture: 'The written policy looks permissive. Past denials turn on the letterhead date and the exact package name.',
    writtenPolicy: [
      'An ultrasound report is required.',
      'Any clinically reasonable package name is acceptable.',
      'Additional laboratory reports are welcome.',
    ],
  },
  {
    id: 'northline' as const,
    name: 'Northline General Insurance',
    deskCode: 'NGI-17',
    tat: 'same morning',
    posture: 'The checklist is short. Clearance depends on a laboratory panel and a fitness note from the last 14 days.',
    writtenPolicy: [
      'Submit the standard surgical package with clinical notes.',
      'Imaging may be attached. Letterhead format is not specified.',
      'Pre-operative investigations follow the hospital protocol.',
    ],
  },
  {
    id: 'harbour' as const,
    name: 'Harbour Indemnity',
    deskCode: 'HBI-22',
    tat: 'same morning',
    posture: 'The written policy stops at clinical notes. Past denials turn on an unsigned consent and a lump-sum estimate.',
    writtenPolicy: [
      'Clinical notes and an ultrasound are sufficient.',
      'Consent and the estimate follow the hospital file.',
      'Package wording is not specified.',
    ],
  },
  {
    id: 'sable' as const,
    name: 'Sable Mutual',
    deskCode: 'SMU-09',
    tat: 'before noon',
    posture: 'The written policy treats identity as the hospital’s job. Clearance needs a photo, the policy card, and a CBC.',
    writtenPolicy: [
      'Submit the surgical package with clinical notes.',
      'Identity is checked by the hospital at admission.',
      'Investigations follow the hospital protocol.',
    ],
  },
]

export const tickerItems = [
  { insurer: 'Meridian', rule: 'Scan date must be on hospital letterhead, not only on the radiology printout' },
  { insurer: 'Meridian', rule: 'Package name “management” is denied. Use “laparoscopic cholecystectomy”' },
  { insurer: 'Meridian', rule: 'A culture report that does not match the diagnosis causes a query' },
  { insurer: 'Northline', rule: 'Letterhead format is ignored. Missing labs are not' },
  { insurer: 'Northline', rule: 'CBC and a matching culture report are required before send' },
  { insurer: 'Northline', rule: 'Fitness note older than 14 days is queried' },
  { insurer: 'Harbour', rule: 'A surgical consent that is not signed is denied' },
  { insurer: 'Harbour', rule: 'A lump-sum estimate is denied. The estimate must be itemised' },
  { insurer: 'Sable', rule: 'Photo identity and the policy e-card are required' },
  { insurer: 'Sable', rule: 'A missing CBC is queried even when the culture is present' },
]
