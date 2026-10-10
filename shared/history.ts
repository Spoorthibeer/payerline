import type { PayerId } from "./types";

export interface HistoryDocument {
  payerId: PayerId;
  documentId: string;
  timestamp: string;
  context: string;
  tags: string[];
  content: string;
}

const procedure = "procedure:cholecystectomy";

export const HISTORY: HistoryDocument[] = [
  {
    payerId: "meridian",
    documentId: "meridian-policy",
    timestamp: "2025-01-01T00:00:00Z",
    context: "written cashless policy, Meridian Health Assurance, laparoscopic cholecystectomy",
    tags: [procedure, "source:policy"],
    content: `Meridian Health Assurance published cashless policy for laparoscopic cholecystectomy at St. Brigid Memorial.
The written policy says an ultrasound report is required.
The written policy says any clinically reasonable package name is acceptable.
The written policy says additional laboratory reports are welcome and should not delay approval.
The written policy does not mention hospital letterhead, the exact wording of the package name, or a physician fitness certificate.`,
  },
  {
    payerId: "meridian",
    documentId: "meridian-2025-11-12",
    timestamp: "2025-11-12T09:20:00Z",
    context: "cashless denial, Meridian Health Assurance, planned laparoscopic cholecystectomy",
    tags: [procedure, "outcome:denied"],
    content: `On 12 November 2025 Meridian Health Assurance denied cashless approval for Mrs. Meera Iyer, laparoscopic cholecystectomy, diagnosis acute calculus cholecystitis.
The ultrasound report was attached, but the scan date was not printed on hospital letterhead.
The package name submitted was "conservative management".
Denial reasons stated by Meridian: ultrasound date not on hospital letterhead, and package name mismatch.
The file was not approved.`,
  },
  {
    payerId: "meridian",
    documentId: "meridian-2025-12-03",
    timestamp: "2025-12-03T11:05:00Z",
    context: "cashless approval after correction, Meridian Health Assurance",
    tags: [procedure, "outcome:approved"],
    content: `On 3 December 2025 Meridian Health Assurance first queried, then approved, cashless cover for Mr. Harish Kulkarni, laparoscopic cholecystectomy.
The resubmitted packet put the ultrasound date on hospital letterhead and changed the package name to "laparoscopic cholecystectomy".
No culture report was attached.
Meridian approved the corrected packet the same afternoon.`,
  },
  {
    payerId: "meridian",
    documentId: "meridian-2026-01-18",
    timestamp: "2026-01-18T08:40:00Z",
    context: "repeat cashless denial, Meridian Health Assurance",
    tags: [procedure, "outcome:denied"],
    content: `On 18 January 2026 Meridian Health Assurance denied Ms. Farzana Qureshi, laparoscopic cholecystectomy.
The ultrasound was attached again, and again the date was missing from the hospital letterhead.
The package name was "management".
Meridian repeated the same two denial reasons: scan date not on letterhead, and package name mismatch.
This was the second denial of that pattern.`,
  },
  {
    payerId: "meridian",
    documentId: "meridian-2026-02-09",
    timestamp: "2026-02-09T10:15:00Z",
    context: "cashless approval, Meridian Health Assurance",
    tags: [procedure, "outcome:approved"],
    content: `On 9 February 2026 Meridian Health Assurance approved Mrs. Lata Shenoy, laparoscopic cholecystectomy, on first submission.
The ultrasound date was on hospital letterhead.
The package name was exactly "laparoscopic cholecystectomy".
No extra culture report was included.
Approval arrived before the patient was moved to theatre.`,
  },
  {
    payerId: "meridian",
    documentId: "meridian-2026-03-02",
    timestamp: "2026-03-02T16:30:00Z",
    context: "cashless query caused by a contradictory laboratory report, Meridian Health Assurance",
    tags: [procedure, "outcome:queried"],
    content: `On 2 March 2026 Meridian Health Assurance queried Mr. Joseph D'Souza, laparoscopic cholecystectomy for acute calculus cholecystitis.
The letterhead date and package name were correct, so those were not the problem.
An extra culture report was attached. The report described no growth and mentioned an unrelated urinary finding.
Meridian's query said the laboratory attachment did not support the stated diagnosis, and the query delayed approval by a day.
Adding that culture report made the file worse, not better.`,
  },
  {
    payerId: "meridian",
    documentId: "meridian-2026-04-21",
    timestamp: "2026-04-21T09:50:00Z",
    context: "cashless approval without a culture report, Meridian Health Assurance",
    tags: [procedure, "outcome:approved"],
    content: `On 21 April 2026 Meridian Health Assurance approved Mrs. Nandini Rao, laparoscopic cholecystectomy.
The ultrasound date was on hospital letterhead.
The package name was "laparoscopic cholecystectomy".
The desk deliberately left out the culture report.
Meridian approved the file with no query.`,
  },
  {
    payerId: "northline",
    documentId: "northline-policy",
    timestamp: "2025-01-01T00:00:00Z",
    context: "written cashless policy, Northline General Insurance, laparoscopic cholecystectomy",
    tags: [procedure, "source:policy"],
    content: `Northline General Insurance published cashless policy for planned surgery at St. Brigid Memorial.
The written policy says to submit the standard surgical package with supporting clinical notes.
The written policy says imaging may be attached when available and does not specify hospital letterhead.
The written policy says pre-operative investigations follow the hospital’s own protocol.
The written policy does not require a culture report or a fitness-for-surgery note dated within 14 days.`,
  },
  {
    payerId: "northline",
    documentId: "northline-2025-10-04",
    timestamp: "2025-10-04T13:10:00Z",
    context: "cashless denial, Northline General Insurance",
    tags: [procedure, "outcome:denied"],
    content: `On 4 October 2025 Northline General Insurance denied cashless approval for Mr. Arvind Bedi, laparoscopic cholecystectomy.
The ultrasound was attached and the scan date was on hospital letterhead. Northline did not mention the letterhead.
The packet had no pre-operative laboratory panel and no culture report.
Northline denied the file because the pre-operative laboratory panel, including culture, was missing.`,
  },
  {
    payerId: "northline",
    documentId: "northline-2025-11-19",
    timestamp: "2025-11-19T15:25:00Z",
    context: "cashless approval, Northline General Insurance",
    tags: [procedure, "outcome:approved"],
    content: `On 19 November 2025 Northline General Insurance approved Ms. Rhea Kapoor, laparoscopic cholecystectomy.
The packet included a complete blood count and a culture report consistent with the diagnosis.
The package name submitted was "management". Northline accepted that package name.
The ultrasound date was not on letterhead. Northline still approved the file.`,
  },
  {
    payerId: "northline",
    documentId: "northline-2026-01-07",
    timestamp: "2026-01-07T08:05:00Z",
    context: "cashless denial for missing laboratories, Northline General Insurance",
    tags: [procedure, "outcome:denied"],
    content: `On 7 January 2026 Northline General Insurance denied Mr. Prakash Nair, laparoscopic cholecystectomy.
The ultrasound date was printed on hospital letterhead and the clinical note was complete.
The laboratory panel and culture report were missing.
Northline denied the admission for the missing pre-operative labs. The letterhead was not cited.`,
  },
  {
    payerId: "northline",
    documentId: "northline-2026-02-26",
    timestamp: "2026-02-26T12:45:00Z",
    context: "cashless approval with laboratories, Northline General Insurance",
    tags: [procedure, "outcome:approved"],
    content: `On 26 February 2026 Northline General Insurance approved Mrs. Shalini Dutta, laparoscopic cholecystectomy, on first submission.
CBC and a culture report were attached and matched acute calculus cholecystitis.
A physician fitness note dated 4 days earlier was attached.
The package name was "management".
Northline approved the file.`,
  },
  {
    payerId: "northline",
    documentId: "northline-2026-05-14",
    timestamp: "2026-05-14T17:20:00Z",
    context: "cashless query for a stale fitness note, Northline General Insurance",
    tags: [procedure, "outcome:queried"],
    content: `On 14 May 2026 Northline General Insurance queried Mr. Imran Sheikh, laparoscopic cholecystectomy.
Laboratories and the culture report were present and consistent.
The physician fitness-for-surgery note was 21 days old.
Northline queried the file and asked for a fitness note dated within 14 days of admission.
The query held the patient overnight.`,
  },
  {
    payerId: "harbour",
    documentId: "harbour-policy",
    timestamp: "2025-01-01T00:00:00Z",
    context: "written cashless policy, Harbour Indemnity, laparoscopic cholecystectomy",
    tags: [procedure, "source:policy"],
    content: `Harbour Indemnity published cashless policy for laparoscopic cholecystectomy at St. Brigid Memorial.
The written policy says clinical notes and an ultrasound are sufficient.
The written policy says consent and the estimate follow the hospital's own file.
The written policy does not mention a signed consent form, an itemised estimate, hospital letterhead, or the exact package name.`,
  },
  {
    payerId: "harbour",
    documentId: "harbour-2025-10-08",
    timestamp: "2025-10-08T10:15:00Z",
    context: "cashless denial, Harbour Indemnity, missing consent and lump-sum estimate",
    tags: [procedure, "outcome:denied"],
    content: `On 8 October 2025 Harbour Indemnity denied cashless approval for Mr. Arjun Sethi, laparoscopic cholecystectomy, diagnosis acute calculus cholecystitis.
The ultrasound was on hospital letterhead and the package name was "laparoscopic cholecystectomy".
The surgical consent form was not signed.
The estimate was a single lump-sum figure, not itemised.
Harbour denied the file for the unsigned consent and the lump-sum estimate.`,
  },
  {
    payerId: "harbour",
    documentId: "harbour-2026-01-19",
    timestamp: "2026-01-19T08:40:00Z",
    context: "cashless denial, Harbour Indemnity, consent and estimate again",
    tags: [procedure, "outcome:denied"],
    content: `On 19 January 2026 Harbour Indemnity denied Mrs. Leela Nair, laparoscopic cholecystectomy.
The package name was "management". Letterhead was not used.
The consent form was missing and the estimate was not itemised.
Harbour denied the file for those two documents. Package wording was not cited.`,
  },
  {
    payerId: "harbour",
    documentId: "harbour-2026-03-18",
    timestamp: "2026-03-18T11:05:00Z",
    context: "cashless approval after consent and itemised estimate, Harbour Indemnity",
    tags: [procedure, "outcome:approved"],
    content: `On 18 March 2026 Harbour Indemnity approved Mr. Vivek Rao, laparoscopic cholecystectomy, on first submission.
A signed surgical consent and an itemised estimate were attached.
The package name was "management". The ultrasound date was not on hospital letterhead.
Harbour approved the file.`,
  },
  {
    payerId: "sable",
    documentId: "sable-policy",
    timestamp: "2025-01-01T00:00:00Z",
    context: "written cashless policy, Sable Mutual, laparoscopic cholecystectomy",
    tags: [procedure, "source:policy"],
    content: `Sable Mutual published cashless policy for laparoscopic cholecystectomy at St. Brigid Memorial.
The written policy says to submit the surgical package with clinical notes.
The written policy says identity is checked by the hospital at admission.
The written policy says investigations follow the hospital protocol.
The written policy does not mention a photo identity, a policy e-card, or a CBC report.`,
  },
  {
    payerId: "sable",
    documentId: "sable-2025-12-11",
    timestamp: "2025-12-11T09:30:00Z",
    context: "cashless denial, Sable Mutual, missing identity papers",
    tags: [procedure, "outcome:denied"],
    content: `On 11 December 2025 Sable Mutual denied cashless approval for Ms. Farida Khan, laparoscopic cholecystectomy, diagnosis acute calculus cholecystitis.
No photo identity and no policy e-card were in the packet.
CBC and the culture report were attached and matched the diagnosis.
The package name was "laparoscopic cholecystectomy".
Sable denied the file because photo identity and the policy card were missing.`,
  },
  {
    payerId: "sable",
    documentId: "sable-2026-02-04",
    timestamp: "2026-02-04T15:10:00Z",
    context: "cashless query, Sable Mutual, missing CBC",
    tags: [procedure, "outcome:queried"],
    content: `On 4 February 2026 Sable Mutual queried Mr. Nikhil Bose, laparoscopic cholecystectomy.
Photo identity and the policy e-card were attached.
The CBC report was missing. A culture report was present.
Sable queried the file and asked for the CBC before it would clear the admission.`,
  },
  {
    payerId: "sable",
    documentId: "sable-2026-04-16",
    timestamp: "2026-04-16T13:25:00Z",
    context: "cashless approval with identity papers and CBC, Sable Mutual",
    tags: [procedure, "outcome:approved"],
    content: `On 16 April 2026 Sable Mutual approved Mrs. Anjali Menon, laparoscopic cholecystectomy, on first submission.
Photo identity, the policy e-card, and a CBC report were attached.
The package name was "management". The ultrasound date was not on hospital letterhead.
Sable approved the file.`,
  },
];

export const DEFAULT_NOTE = `St. Brigid Memorial Hospital
Cashless pre-authorisation note

Patient: Mrs. Ananya Rao, 46 years, MRN SB-44821
Ward: Surgical admission, planned theatre tomorrow 07:40
Diagnosis: Acute calculus cholecystitis
Proposed procedure: Laparoscopic cholecystectomy
Payer: Meridian Health Assurance
Package name on the draft form: management

Documents currently in the packet:
- Ultrasound report is attached. The scan date is on the radiology printout, not on hospital letterhead.
- A culture report is also clipped to the file. It shows no growth and mentions an unrelated urinary finding.
- No physician fitness-for-surgery certificate is in the file.

The clinical team has asked revenue cycle to send the cashless request before noon so the list is not disturbed.`;
