# OpsPilot AI

**AI Workflow Triage Dashboard for operations teams**

OpsPilot AI turns messy operational tickets into a prioritized, reviewable workflow. Import tickets from CSV, run AI triage, and get structured outputs: category, priority, responsible team, summary, next action, draft response, confidence, and review status.

Use it to turn raw operational requests into a queue your team can review, approve, reject, export, and act on.

## Problem

Operations teams often receive requests from many channels: transport updates, warehouse issues, missing documents, customer escalations, quality checks, and safety concerns.

Before anyone can act, someone has to manually answer the same questions:

- What type of issue is this?
- How urgent is it?
- Which team owns it?
- What should happen next?
- What should we reply to the requester?

OpsPilot AI automates the first triage layer so a human can review and act faster.

## Features

- Imports operational tickets from CSV.
- Validates required ticket fields.
- Runs in demo mode without API keys.
- Supports OpenAI or Claude for real AI triage.
- Classifies tickets by operational category.
- Assigns priority and responsible team.
- Generates summary, next action, and draft response.
- Provides human review controls: `Approve`, `Needs Review`, `Reject`.
- Filters by priority, category, team, and status.
- Exports triage results as CSV or JSON.

## Quick Start

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

The app starts with sample operations tickets. Click `Run AI triage` in demo mode to process them without any API key.

## Workflow

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

## Configure Real AI Mode

Demo mode works without credentials. To use real AI triage, create `.env.local` and add one or both providers.

OpenAI:

```text
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

Claude:

```text
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-sonnet-4-5
```

Then select `OpenAI` or `Claude` in the dashboard before running triage.

## CSV Format

Required columns:

```text
id,title,description,source,createdAt
```

A sample file is included at:

```text
public/sample-tickets.csv
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
