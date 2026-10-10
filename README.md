# PayerLine

PayerLine is a cashless pre-authorisation advisor for hospital billing desks. Its deployed UI is the Next.js app in `payer-line-product-template/`; Express API routes in that app use the synced code in `payer-line-product-template/desk/`.

**Advice only. A person still sends the file.** The app does not diagnose or auto-submit an insurer request. Hospitals and insurers are fictional. Documents and patient identities are never stored in memory.

## Fictional hospitals

| Hospital | City |
|---|---|
| Sri Venkateswara Multispeciality Hospital | Hyderabad |
| Kaveri Care Hospital | Bengaluru |
| Sahyadri Lifeline Hospital | Pune |
| Ganga Seva Medical Centre | Varanasi |

## Insurer memory banks

Each insurer has its own Hindsight bank; information is never mixed between banks.

| Bank | Insurer | Simulated document habits |
|---|---|---|
| `payerline-bharat-arogya` | Bharat Arogya Insurance | Dated reports on hospital letterhead; exact package name |
| `payerline-suraksha-general` | Suraksha General Insurance | Matching laboratory reports; fitness certificate within 14 days |
| `payerline-navjeevan-health-tpa` | Navjeevan Health TPA | Signed surgical consent; itemised estimate |
| `payerline-jan-raksha` | Jan Raksha Yojana | Aadhaar/e-KYC, scheme e-card, matching package code, and CBC |

## Procedures and documents

The desk supports laparoscopic cholecystectomy, cataract surgery, C-section delivery, and total knee replacement. Seed history provides four dated simulated approvals, queries, or denials for every insurer/procedure pair, with reasons and amounts in ₹.

The packet checklist covers:

1. Signed Pre-Authorisation Request Form
2. TPA ID card / insurer e-card (Jan Raksha scheme e-card)
3. Aadhaar photo ID + e-KYC, or PAN / voter ID
4. Policy copy with sum insured and room-rent limit
5. Doctor's admission advice with provisional diagnosis
6. Relevant investigation reports, dated on hospital letterhead
7. Physician fitness certificate and age in days
8. Signed surgical consent form
9. Itemised cost estimate
10. Package name / code matching the procedure
11. MLC / FIR copy, shown only for accident cases

## Patient and desk modes

The header lets a visitor choose patient self-service or hospital billing staff mode, and select English, Hindi, or Telugu. Patient mode uses hospital, insurer, surgery, and document selections to show a plain-language checklist. It can print the checklist or share its document list on WhatsApp; no name or personal details are requested or saved.

A six-digit patient token is optional. A patient may create one to let billing staff open the same anonymous selections in desk mode; checking and printing the patient checklist do not require a token. Tokens are held in process memory for up to 24 hours, contain no personal data, and are lost on server restart. A real deployment needs a database and a suitable shared store with expiry.

Desk mode is PIN-protected. Set `DESK_PIN` in the environment; the demo fallback is `1234`. Desk staff can enter a patient token to load the selections, review the full case, and print the checklist in the patient's selected language.

After staff mark a file as sent to the insurer, PayerLine displays the IRDAI one-hour decision countdown and deadline in IST. Recording an approval opens a mandatory review for requested and approved amounts, decision time, and whether a query was raised. An approval cannot be saved until those required fields are complete. Query and denial outcomes continue to require a reason. Approval review facts are saved to that insurer's memory bank without patient identifiers.

## How the advice works

1. The desk selects a fictional hospital, procedure, insurer, and the documents in the packet.
2. PayerLine recalls matching outcomes from that insurer's bank and asks Hindsight to reflect on the current facts.
3. The result shows the memory decision and packet checklist separately. The checklist can add a safety hold; it cannot overwrite the memory's decision.
4. When staff record an insurer outcome, the reason and document facts can be retained in that insurer's bank for future recall.

Memory stores only insurer, procedure, document facts, outcome, and reason. Documents and patient identities are never stored in memory.

## Stack

- **Live UI** — Next.js, `payer-line-product-template/`
- **API** — Node, Express, TypeScript, `server/`
- **Memory** — Hindsight Cloud (`@vectorize-io/hindsight-client`), one bank per insurer
- **Note parsing** — Groq chat completions with function calling
- **Shared case data** — `shared/` (insurers, hospitals, procedures, packet rules, seeded history, types)

The desk UI posts to `/api/review`; the API recalls and reflects against one insurer bank. `/api/outcome` records an insurer reply. The Next.js API routes import the matching server/shared copy under `payer-line-product-template/desk/`.

When changing root `server/` or `shared/`, run:

```bash
node scripts/sync-desk.mjs
```

Do not edit `payer-line-product-template/desk/` separately from its root source.

## Setup

Copy `.env.example` to `.env` and set the service credentials:

```env
HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=your_hindsight_key
GROQ_API_KEY=your_groq_key
GROQ_MODEL=openai/gpt-oss-120b
PORT=8787
DESK_PIN=1234
```

Install both workspaces, seed the insurer memory banks, and run the app:

```bash
npm install
npm install --prefix payer-line-product-template
npm run seed
npm run dev
```

The desk runs at [http://localhost:5173](http://localhost:5173); the API health check is [http://localhost:8787/api/health](http://localhost:8787/api/health).

Build and typecheck:

```bash
npm run typecheck
npm run build
```

`npm run build` builds the live Next.js app.

## Project layout

```text
shared/                         # Insurers, fictional hospitals, procedures, packet rules, types, history
server/                         # Express API, Hindsight, Groq, review flow
scripts/seed.ts                 # Provision banks + retain simulated history
scripts/sync-desk.mjs           # Sync root server/shared into the live Next app
payer-line-product-template/    # Deployed Next.js app and API routes
```
