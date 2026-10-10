export type PayerId = "meridian" | "northline" | "harbour" | "sable";

export type OutcomeKind = "approved" | "queried" | "denied";

export type Confidence = "thin" | "moderate" | "strong";

export interface Payer {
  id: PayerId;
  bankId: string;
  name: string;
  shortName: string;
  deskCode: string;
  posture: string;
  writtenPolicy: string[];
}

export interface AdmissionCase {
  patientName: string;
  age: number;
  gender: string;
  mrn: string;
  ward: string;
  scheduledAt: string;
  diagnosis: string;
  procedure: string;
  payerId: PayerId;
  packageName: string;
  ultrasoundAttached: boolean;
  ultrasoundDateOnLetterhead: boolean;
  cultureReportAttached: boolean;
  cultureContradictsDiagnosis: boolean;
  fitnessCertificateAttached: boolean;
  fitnessCertificateAgeDays: number;
  consentAttached: boolean;
  itemisedEstimateAttached: boolean;
  photoIdAttached: boolean;
  policyCardAttached: boolean;
  cbcAttached: boolean;
  clinicalNote: string;
}

export interface PacketFix {
  title: string;
  detail: string;
}

export interface EvidenceItem {
  id: string;
  text: string;
  type?: string;
  occurred?: string;
  context?: string;
}

export interface ReviewDecision {
  decision: "hold" | "send";
  confidence: Confidence;
  policyConflict: boolean;
  summary: string;
  fixes: string[];
  doNotAdd: string[];
  evidence: string[];
  narrative: string;
  basedOn: EvidenceItem[];
}

export interface ReviewResponse {
  payer: Payer;
  bankId: string;
  decision: ReviewDecision;
  recalled: EvidenceItem[];
  /** Recent stored outcomes for this procedure / matching package. */
  outcomes: EvidenceItem[];
  reviewedAt: string;
}

export interface OutcomeInput {
  payerId: PayerId;
  caseSnapshot: AdmissionCase;
  outcome: OutcomeKind;
  reason: string;
}

export interface LedgerEntry {
  id: string;
  text: string;
  type?: string;
  occurred?: string;
  context?: string;
}

export interface LedgerResponse {
  payer: Payer;
  bankId: string;
  entries: LedgerEntry[];
}

export interface ExtractedFields {
  diagnosis: string;
  procedure: string;
  payerId: PayerId;
  packageName: string;
  ultrasoundAttached: boolean;
  ultrasoundDateOnLetterhead: boolean;
  cultureReportAttached: boolean;
  cultureContradictsDiagnosis: boolean;
  fitnessCertificateAttached: boolean;
  fitnessCertificateAgeDays: number;
}
