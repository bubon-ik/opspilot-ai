# OpsPilot AI

**AI Workflow Triage Dashboard for operations teams**

OpsPilot AI turns messy operational tickets into a prioritized, reviewable workflow. Import tickets from CSV, run AI triage, and get structured outputs: category, priority, responsible team, summary, next action, draft response, confidence, and review status.

This is a portfolio SaaS project built to demonstrate practical AI automation, API processing, React dashboard work, and clear technical documentation.

## Problem

Operations teams often receive requests from many channels: transport updates, warehouse issues, missing documents, customer escalations, quality checks, and safety concerns.

Before anyone can act, someone has to manually answer the same questions:

- What type of issue is this?
- How urgent is it?
- Which team owns it?
- What should happen next?
- What should we reply to the requester?

OpsPilot AI automates the first triage layer so a human can review and act faster.

## What It Does

- Imports operational tickets from CSV.
- Validates required ticket fields.
- Runs triage in demo mode without API keys.
- Supports real AI mode with OpenAI or Claude API keys.
- Classifies tickets by operational category.
- Assigns priority and responsible team.
- Generates summary, next action, and draft response.
- Provides human review controls: `Approve`, `Needs Review`, `Reject`.
- Filters by priority, category, team, and status.
- Exports AI results as CSV or JSON.

## Demo Workflow

```text
CSV tickets
  -> AI triage
  -> structured queue
  -> human review
  -> CSV / JSON export
```

Example input:

```csv
id,title,description,source,createdAt
OPS-1001,"Outbound truck delayed at gate 4","Carrier reported a 45 minute delay because the loading bay is blocked by another trailer.","Transport","2026-04-25T08:00:00Z"
```

Example output:

```json
{
  "id": "OPS-1001",
  "category": "Delay",
  "priority": "High",
  "responsibleTeam": "Transport Coordination",
  "summary": "Outbound truck delayed at gate 4: Carrier reported a 45 minute delay because the loading bay is blocked by another trailer.",
  "nextAction": "Ask Transport Coordination to confirm revised ETA and update the dispatch plan.",
  "draftResponse": "Thanks for the update on \"Outbound truck delayed at gate 4\". I am routing this to Transport Coordination and will confirm the next action after review.",
  "confidence": 0.87,
  "status": "New"
}
```

## Tech Stack

- **Next.js 16**
- **React 19**
- **TypeScript**
- **OpenAI API**
- **Claude API**
- **Vitest**
- **Vercel-ready deployment**

## Project Structure

```text
app/
  api/triage/route.ts     API route for demo, OpenAI, and Claude triage
  page.tsx                Main dashboard UI
  globals.css             Product UI styling
lib/
  csv.ts                  CSV parsing and validation
  export.ts               CSV/JSON export helpers
  sample-data.ts          Demo operations tickets
  triage.ts               Demo and real AI triage logic
  types.ts                Shared TypeScript types
public/
  sample-tickets.csv      Downloadable sample dataset
tests/
  csv.test.ts             CSV parser tests
  export.test.ts          Export tests
  triage.test.ts          Demo triage tests
```

## CSV Format

Required columns:

```text
id,title,description,source,createdAt
```

A sample file is included at:

```text
public/sample-tickets.csv
```

## AI Modes

### Demo Mode

Demo mode works without credentials. It uses deterministic triage rules so the app can be tested and shown as a portfolio demo with no paid API usage.

### OpenAI Mode

Create `.env.local`:

```text
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

### Claude Mode

Create `.env.local`:

```text
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-sonnet-4-5
```

## API

```text
POST /api/triage
```

Request:

```json
{
  "mode": "demo",
  "tickets": [
    {
      "id": "OPS-1001",
      "title": "Outbound truck delayed at gate 4",
      "description": "Carrier reported a 45 minute delay because the loading bay is blocked by another trailer.",
      "source": "Transport",
      "createdAt": "2026-04-25T08:00:00Z"
    }
  ]
}
```

Response:

```json
{
  "results": [
    {
      "id": "OPS-1001",
      "category": "Delay",
      "priority": "High",
      "responsibleTeam": "Transport Coordination",
      "summary": "Outbound truck delayed at gate 4: Carrier reported a 45 minute delay because the loading bay is blocked by another trailer.",
      "nextAction": "Ask Transport Coordination to confirm revised ETA and update the dispatch plan.",
      "draftResponse": "Thanks for the update on \"Outbound truck delayed at gate 4\". I am routing this to Transport Coordination and will confirm the next action after review.",
      "confidence": 0.87,
      "status": "New"
    }
  ],
  "meta": {
    "mode": "demo",
    "processedAt": "2026-04-25T10:30:00.000Z"
  }
}
```

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Verification

```bash
npm test
npm run typecheck
npm run build
```

Current automated coverage includes:

- valid CSV import
- missing CSV column validation
- deterministic demo triage
- CSV export escaping

## Deploy

The app is ready for Vercel.

Demo mode works without environment variables. Add `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in Vercel only if you want real AI triage mode.

## Portfolio Case Summary

**OpsPilot AI — AI Workflow Triage Dashboard**

Built a Next.js/TypeScript SaaS prototype that imports operational tickets from CSV, processes them through demo or real AI triage, and returns structured workflow decisions in a review dashboard.

This project demonstrates:

- API automation
- AI processing with OpenAI/Claude
- CSV validation and export
- operations-focused workflow design
- human-in-the-loop review UX
- technical documentation and setup clarity
