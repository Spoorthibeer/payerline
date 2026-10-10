import type { PatientTokenCase } from "@shared/types";
import { HOSPITALS, PROCEDURES } from "@shared/catalog";
import { PAYERS } from "@shared/payers";
import { createPatientToken, getPatientToken } from "@server/patient-tokens";
import { jsonError } from "@/lib/desk-errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isPatientTokenCase(body)) {
      return Response.json({ error: "Choose a hospital, insurer, surgery, and valid document checklist." }, { status: 400 });
    }
    return Response.json(createPatientToken(body));
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (!/^\d{6}$/.test(token)) {
    return Response.json({ error: "Enter a six-digit patient token." }, { status: 400 });
  }
  const value = getPatientToken(token);
  if (!value) {
    return Response.json({ error: "That patient token has expired or was not found." }, { status: 404 });
  }
  return Response.json(value);
}

function isPatientTokenCase(value: unknown): value is PatientTokenCase {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PatientTokenCase>;
  const documents = candidate.documents;
  return Boolean(
    HOSPITALS.some((hospital) => hospital.id === candidate.hospitalId) &&
    PAYERS.some((payer) => payer.id === candidate.payerId) &&
    typeof candidate.procedure === "string" &&
    PROCEDURES.some((procedure) => procedure.name === candidate.procedure) &&
    typeof candidate.packageName === "string" &&
    typeof candidate.packageCode === "string" &&
    typeof candidate.accidentCase === "boolean" &&
    documents &&
    typeof documents.preAuthorizationForm === "boolean" &&
    typeof documents.insurerCard === "boolean" &&
    ["aadhaar", "pan", "voter-id", "missing"].includes(documents.identityProof) &&
    typeof documents.policyCopy === "boolean" &&
    typeof documents.admissionAdvice === "boolean" &&
    typeof documents.investigationReports === "boolean" &&
    typeof documents.investigationReportsOnLetterheadAndDated === "boolean" &&
    typeof documents.investigationReportsMatchDiagnosis === "boolean" &&
    typeof documents.cbcAttached === "boolean" &&
    typeof documents.fitnessCertificate === "boolean" &&
    Number.isFinite(documents.fitnessCertificateAgeDays) &&
    typeof documents.signedSurgicalConsent === "boolean" &&
    typeof documents.itemisedEstimate === "boolean" &&
    typeof documents.mlcFir === "boolean",
  );
}
