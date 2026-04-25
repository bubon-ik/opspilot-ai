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
- Supports OpenAI or Claude for AI triage.
- Protects the dashboard and triage API with Clerk authentication.
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

Create a Clerk application and add the auth keys to `.env.local`:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

The app redirects signed-out users to `/sign-in`. After signing in, it starts with sample operations tickets. Add your OpenAI or Claude API key in the dashboard, choose a provider, and click `Run AI triage`.

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

## API Keys

OpsPilot AI uses bring-your-own-key requests from the dashboard. The API key is sent to the server only for the current triage request, is not saved to a database, and is not exported with results.

For local integration tests, you can also create `.env.local` and add one or both providers.

OpenAI:

```text
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

Claude:

```text
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-sonnet-4-20250514
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
  api/triage/route.ts     API route for OpenAI and Claude triage
  sign-in/                Clerk sign-in route
  sign-up/                Clerk sign-up route
  page.tsx                Main dashboard UI
  globals.css             Product UI styling
lib/
  auth-config.ts          Shared Clerk public route config
  csv.ts                  CSV parsing and validation
  export.ts               CSV/JSON export helpers
  sample-data.ts          Sample operations tickets
  triage.ts               OpenAI and Claude triage logic
  types.ts                Shared TypeScript types
public/
  sample-tickets.csv      Downloadable sample dataset
tests/
  auth-config.test.ts     Auth route config tests
  csv.test.ts             CSV parser tests
  export.test.ts          Export tests
  triage.test.ts          Provider mode and API key tests
```

## API

```text
POST /api/triage
```

Request:

```json
{
  "mode": "openai",
  "apiKey": "sk-...",
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
    "mode": "openai",
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
- provider mode validation
- missing API key handling
- CSV export escaping

Run the real Claude integration test:

```bash
cp .env.example .env.local
npm run test:claude
```

Set `ANTHROPIC_API_KEY` in `.env.local` before running the integration test.

## Deploy

The app is ready for Vercel.

Set these Vercel environment variables:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

No shared production AI key is required. Users paste their own OpenAI or Claude key in the dashboard before running triage.
