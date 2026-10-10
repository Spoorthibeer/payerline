export type PayerId =
  | "bharat-arogya"
  | "suraksha-general"
  | "navjeevan-health-tpa"
  | "jan-raksha-yojana";

export type HospitalId =
  | "sri-venkateswara-hyderabad"
  | "kaveri-care-bengaluru"
  | "sahyadri-lifeline-pune"
  | "ganga-seva-varanasi";

export type IdentityProof = "aadhaar" | "pan" | "voter-id" | "missing";

export interface DocumentChecklist {
  preAuthorizationForm: boolean;
  insurerCard: boolean;
  identityProof: IdentityProof;
  policyCopy: boolean;
  admissionAdvice: boolean;
  investigationReports: boolean;
  investigationReportsOnLetterheadAndDated: boolean;
  investigationReportsMatchDiagnosis: boolean;
  cbcAttached: boolean;
  fitnessCertificate: boolean;
  fitnessCertificateAgeDays: number;
  signedSurgicalConsent: boolean;
  itemisedEstimate: boolean;
  mlcFir: boolean;
}

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
  hospitalId: HospitalId;
  diagnosis: string;
  procedure: string;
  payerId: PayerId;
  packageName: string;
  packageCode: string;
  accidentCase: boolean;
  sentAt?: string;
  documents: DocumentChecklist;
  clinicalNote: string;
}

export interface PatientTokenCase {
  hospitalId: HospitalId;
  payerId: PayerId;
  procedure: string;
  packageName: string;
  packageCode: string;
  accidentCase: boolean;
  documents: DocumentChecklist;
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

export interface ChecklistDecision {
  decision: "hold" | "send";
  summary: string;
  fixes: string[];
  doNotAdd: string[];
}

export interface ReviewResponse {
  payer: Payer;
  bankId: string;
  /** Effective decision; the checklist can only add a safety hold to memory's decision. */
  decision: ReviewDecision;
  /** The unmodified decision returned by Hindsight. */
  memoryDecision: ReviewDecision;
  checklist: ChecklistDecision;
  recalled: EvidenceItem[];
  /** Recent stored outcomes for this procedure / matching package. */
  outcomes: EvidenceItem[];
  reviewedAt: string;
}

export interface OutcomeInput {
  payerId: PayerId;
  caseSnapshot: AdmissionCase;
  outcome: OutcomeKind;
  reason?: string;
  approvalReview?: ApprovalReview;
}

export interface ApprovalReview {
  amountRequested: number;
  amountApproved: number;
  decisionMinutes: number;
  queryRaisedFirst: boolean;
  queriedDocument?: string;
  offChecklistDocument?: string;
  note?: string;
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
  hospitalId: HospitalId;
  payerId: PayerId;
  packageName: string;
  packageCode: string;
  accidentCase: boolean;
  documents: DocumentChecklist;
}
