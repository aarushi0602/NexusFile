# NexusFile Frontend

React + Vite app for the NexusFile GST compliance ledger. Talks to the
FastAPI backend running on `http://localhost:8000` by default.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Visit `http://localhost:5173`. Make sure the backend is running first
(`uvicorn main:app --reload` in the `nexusfile-backend` folder) or
uploads will fail.

## Structure

- `src/pages/Dashboard.jsx` — landing page, starts a new case via upload
- `src/pages/CaseDetail.jsx` — main working view: reconciliation ledger,
  draft generation, approval gate, filing
- `src/components/UploadPanel.jsx` — drag-and-drop invoice upload
- `src/components/ReconciliationView.jsx` — the invoice ledger with
  matched / mismatched / missing status marks
- `src/components/ApprovalGate.jsx` — human approval step before filing
- `src/components/CaseTimeline.jsx` — case lifecycle status
- `src/api/client.js` — all backend API calls in one place

## Design notes

Built as a working ledger, not a generic dashboard: navy ink on warm
paper, tabular monospace numerals for every amount, hairline dividers
between invoice rows instead of shadowed cards, and status shown as
small colored marks rather than loud badges. See
`src/styles/index.css` for the full token system if you want to adjust
colors or type.

## Demo GSTIN/period

`CaseDetail.jsx` hardcodes a demo GSTIN and period (`DEMO_GSTIN`,
`DEMO_PERIOD`) for the draft/filing calls. Replace these with real
sandbox values matching your synthetic dataset before demoing, or wire
up a small settings form if you have time.
