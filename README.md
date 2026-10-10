# PayerLine

**Cashless pre-authorisation desk for St. Brigid Memorial Hospital.**

PayerLine helps the hospital desk decide whether to **hold** or **send** a cashless file *before* it goes to the insurer. The decision comes from what that insurer has actually done on past cases — not from the written policy alone.

Memory is the product. Each insurer has its own [Hindsight](https://hindsight.vectorize.io) bank. Banks never mix. The agent advises only. A person still sends the file. It does not diagnose, and it does not auto-submit.

---

## The problem

Written cashless policy often looks complete. Real denials and queries turn on details the policy never states:

- Meridian may deny a packet because the ultrasound date is only on the radiology printout, not on hospital letterhead, or because the package name says “management” instead of the real procedure.
- Northline may ignore letterhead and accept “management,” then hold the same surgery for missing labs or a fitness note older than 14 days.
- Harbour cares about a signed consent and an itemised estimate.
- Sable cares about photo identity, the policy e-card, and a CBC.

The senior billing head often carries that knowledge alone. When they are busy or off shift, the desk sends a “complete” file and learns the hard way.

---

## What PayerLine does

1. The desk enters today’s patient and builds the packet (package name, letterhead, culture, fitness, consent, estimate, identity papers, CBC).
2. One insurer bank is opened. The others stay closed.
3. **Recall** pulls similar past outcomes for that insurer and this surgery.
4. **Reflect** returns **hold** or **send**, with:
   - a short summary
   - concrete fixes
   - documents to leave out
   - cited memories
   - a flag when written policy and past outcomes disagree (outcomes govern)
5. When the insurer replies, the desk can **retain** that outcome into the same bank so the next file learns from it.

Default demo surgery: **laparoscopic cholecystectomy** for acute calculus cholecystitis.

---

## Insurer banks

| Bank | Insurer | What memory actually cares about |
|------|---------|----------------------------------|
| `payerline-meridian` | Meridian Health Assurance | Letterhead date, exact package name, contradictory culture |
| `payerline-northline` | Northline General Insurance | Labs / matching culture, fitness note ≤ 14 days |
| `payerline-harbour` | Harbour Indemnity | Signed surgical consent, itemised estimate |
| `payerline-sable` | Sable Mutual | Photo ID, policy e-card, CBC |

Same procedure. Opposite documents. Separate memory.

---

## How Hindsight is used

| Step | Role in PayerLine |
|------|-------------------|
| **Retain** | Stores written policy and dated approvals, queries, and denials in that insurer’s bank only |
| **Recall** | Surfaces matching past cases for today’s packet |
| **Reflect** | Decides hold / send with fixes, do-not-add, confidence, and citations |

Groq can also parse a clinical note into structured admission fields (with tool-call retries). The live desk can set the packet with toggles and still review against memory.

---

## Stack

- **API** — Node, Express, TypeScript (`server/`), port `8787`
- **UI** — Next.js product page (`payer-line-product-template/`), port `5173`
- **Memory** — Hindsight Cloud (`@vectorize-io/hindsight-client`)
- **Note parsing** — Groq chat completions with function calling
- **Shared case data** — `shared/` (payers, history, types)

---

## System architecture

The desk UI never talks to Hindsight directly. It posts patient + packet fields to Express; the server opens **one** insurer bank, recalls matching outcomes, reflects hold/send, and can retain a later insurer reply into that same bank.

```mermaid
flowchart LR
  subgraph Desk["Cashless desk"]
    UI["Next.js UI<br/>:5173"]
  end

  subgraph API["PayerLine API"]
    Express["Express / TypeScript<br/>:8787"]
    Review["POST /api/review<br/>recall + reflect"]
    Extract["POST /api/extract<br/>optional note parse"]
    Outcome["POST /api/outcome<br/>retain reply"]
    Express --> Review
    Express --> Extract
    Express --> Outcome
  end

  subgraph Shared["shared/"]
    Payers["payers · types"]
    History["seeded history"]
  end

  subgraph Memory["Hindsight Cloud"]
    M["payerline-meridian"]
    N["payerline-northline"]
    H["payerline-harbour"]
    S["payerline-sable"]
  end

  Groq["Groq<br/>function calling"]

  UI -->|"/api/* proxy"| Express
  Review --> Memory
  Outcome --> Memory
  Extract --> Groq
  Review -.-> Shared
  History -.->|"npm run seed"| Memory
```

**Request path for a live check**

```mermaid
sequenceDiagram
  actor Desk as Desk clerk
  participant UI as Next.js UI
  participant API as Express API
  participant HS as Hindsight bank
  participant LLM as Reflect / Groq

  Desk->>UI: Enter patient, pick one insurer, set packet
  UI->>API: POST /api/review
  API->>HS: Recall similar outcomes (that bank only)
  HS-->>API: Cited memories
  API->>LLM: Reflect hold or send
  LLM-->>API: Decision, fixes, do-not-keep
  API-->>UI: Advise-only result
  Note over Desk,UI: Person still sends or holds the file
```

---

## Setup

### 1. Keys

Copy `.env.example` to `.env` and set:

```env
HINDSIGHT_API_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=your_hindsight_key
GROQ_API_KEY=your_groq_key
GROQ_MODEL=openai/gpt-oss-120b
PORT=8787
```

Do not commit `.env`.

### 2. Install

```bash
npm install
npm install --prefix payer-line-product-template
```

### 3. Seed memory

```bash
npm run seed
```

This provisions the four banks, writes directives, and retains the seeded cholecystectomy history (policy + past outcomes). Safe to re-run; documents use stable IDs with replace.

### 4. Run

```bash
npm run dev
```

- Desk UI: [http://localhost:5173](http://localhost:5173)
- API health: [http://localhost:8787/api/health](http://localhost:8787/api/health)

---

## API surface

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | Credentials and payer list |
| `POST` | `/api/extract` | Groq note → structured fields |
| `POST` | `/api/review` | Recall + reflect for one payer |
| `POST` | `/api/outcome` | Retain a live insurer reply |
| `GET` | `/api/ledger?payer=` | Recent memories for that bank |

The Next app proxies `/api/*` to the Express server.

---

## Project layout

```text
shared/                         # Payers, seeded history, shared types
server/                         # Express API, Hindsight, Groq, review flow
scripts/seed.ts                 # Provision banks + retain history
payer-line-product-template/    # Next.js desk UI
```

---

## What this is not

- Not a diagnosis tool
- Not an auto-submitter to insurer portals
- Not one shared memory across all payers

It is advice for the cashless desk: **hold or send**, grounded in insurer-specific outcomes.

---

## License

Built for the Vectorize / Hindsight hackathon. Use and adapt for your own demo as needed.
