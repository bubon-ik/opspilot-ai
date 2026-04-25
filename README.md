# OpsPilot AI

OpsPilot AI is a portfolio SaaS demo for AI workflow triage in operations teams. It imports operational tickets from CSV, processes them through demo or real AI mode, and shows priority, category, owner, next action, draft response, review status, and exports.

## Portfolio Positioning

**OpsPilot AI — AI Workflow Triage Dashboard**

This project demonstrates:

- AI automation with OpenAI or Claude
- API processing through `POST /api/triage`
- CSV import and validation
- React/TypeScript dashboard UI
- Human review controls for operational workflows
- Clear technical documentation and setup instructions

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

Demo mode works without API keys and returns deterministic prepared triage results.

OpenAI mode requires:

```text
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

Claude mode requires:

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

```bash
npm install
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

## Deploy

The app is Vercel-ready. Add `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` in Vercel environment variables only if you want real AI mode. Demo mode works without secrets.
