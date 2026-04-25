import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type {
  ImportedTicket,
  TriageCategory,
  TriageMode,
  TriagePriority,
  TriageRequest,
  TriageResponse,
  TriageResult
} from "./types";

const CATEGORY_RULES: Array<{
  category: TriageCategory;
  priority: TriagePriority;
  team: string;
  keywords: string[];
}> = [
  {
    category: "Safety",
    priority: "Critical",
    team: "Safety Lead",
    keywords: ["injury", "accident", "hazard", "unsafe", "spill", "blocked emergency"]
  },
  {
    category: "Delay",
    priority: "High",
    team: "Transport Coordination",
    keywords: ["delay", "delayed", "late", "waiting", "missed departure", "blocked"]
  },
  {
    category: "Capacity",
    priority: "High",
    team: "Shift Lead",
    keywords: ["capacity", "underloaded", "overloaded", "staff shortage", "volume", "overflow"]
  },
  {
    category: "Documentation",
    priority: "Medium",
    team: "Admin Desk",
    keywords: ["document", "paperwork", "customs", "invoice", "label", "missing reference"]
  },
  {
    category: "Quality",
    priority: "Medium",
    team: "Quality Control",
    keywords: ["damaged", "wrong pallet", "mismatch", "scan error", "deviation", "quality"]
  },
  {
    category: "Customer",
    priority: "High",
    team: "Customer Support",
    keywords: ["customer", "complaint", "urgent help", "client", "reply", "escalation"]
  }
];

function matchRule(ticket: ImportedTicket) {
  const searchable = `${ticket.title} ${ticket.description} ${ticket.source}`.toLowerCase();
  return CATEGORY_RULES.find((rule) => rule.keywords.some((keyword) => searchable.includes(keyword))) ?? null;
}

function urgencyBoost(ticket: ImportedTicket): TriagePriority | null {
  const searchable = `${ticket.title} ${ticket.description}`.toLowerCase();
  if (searchable.includes("critical") || searchable.includes("urgent") || searchable.includes("emergency")) {
    return "Critical";
  }
  if (searchable.includes("today") || searchable.includes("asap") || searchable.includes("high priority")) {
    return "High";
  }
  return null;
}

function strongestPriority(base: TriagePriority, boost: TriagePriority | null): TriagePriority {
  const order: TriagePriority[] = ["Low", "Medium", "High", "Critical"];
  if (!boost) {
    return base;
  }
  return order.indexOf(boost) > order.indexOf(base) ? boost : base;
}

function createFallbackTriageResult(ticket: ImportedTicket): TriageResult {
    const rule = matchRule(ticket);
    const category = rule?.category ?? "Other";
    const priority = strongestPriority(rule?.priority ?? "Low", urgencyBoost(ticket));
    const responsibleTeam = rule?.team ?? "Operations Coordinator";
    const confidence = rule ? 0.87 : 0.68;

    return {
      id: ticket.id,
      category,
      priority,
      responsibleTeam,
      summary: `${ticket.title}: ${ticket.description}`,
      nextAction: buildNextAction(category, responsibleTeam),
      draftResponse: buildDraftResponse(ticket, responsibleTeam),
      confidence,
      status: "New"
    };
}

function buildNextAction(category: TriageCategory, team: string): string {
  const actions: Record<TriageCategory, string> = {
    Delay: `Ask ${team} to confirm revised ETA and update the dispatch plan.`,
    Capacity: `Ask ${team} to review staffing, vehicle capacity, and loading priorities.`,
    Quality: `Route to ${team} for deviation check and corrective action.`,
    Safety: `Escalate to ${team} immediately and pause the affected workflow until reviewed.`,
    Documentation: `Ask ${team} to verify missing documents and confirm shipment readiness.`,
    Customer: `Ask ${team} to send an update and keep the request in review until resolved.`,
    Other: `Assign to ${team} for manual review and define the next operational owner.`
  };

  return actions[category];
}

function buildDraftResponse(ticket: ImportedTicket, team: string): string {
  return `Thanks for the update on "${ticket.title}". I am routing this to ${team} and will confirm the next action after review.`;
}

function normalizeAiResults(tickets: ImportedTicket[], raw: unknown): TriageResult[] {
  const parsed = Array.isArray(raw) ? raw : [];

  return tickets.map((ticket, index) => {
    const candidate = parsed[index] as Partial<TriageResult> | undefined;
    const fallback = createFallbackTriageResult(ticket);

    return {
      id: ticket.id,
      category: isCategory(candidate?.category) ? candidate.category : fallback.category,
      priority: isPriority(candidate?.priority) ? candidate.priority : fallback.priority,
      responsibleTeam: typeof candidate?.responsibleTeam === "string" ? candidate.responsibleTeam : fallback.responsibleTeam,
      summary: typeof candidate?.summary === "string" ? candidate.summary : fallback.summary,
      nextAction: typeof candidate?.nextAction === "string" ? candidate.nextAction : fallback.nextAction,
      draftResponse: typeof candidate?.draftResponse === "string" ? candidate.draftResponse : fallback.draftResponse,
      confidence: typeof candidate?.confidence === "number" ? Math.min(Math.max(candidate.confidence, 0), 1) : fallback.confidence,
      status: "New"
    };
  });
}

function isCategory(value: unknown): value is TriageCategory {
  return (
    value === "Delay" ||
    value === "Capacity" ||
    value === "Quality" ||
    value === "Safety" ||
    value === "Documentation" ||
    value === "Customer" ||
    value === "Other"
  );
}

function isPriority(value: unknown): value is TriagePriority {
  return value === "Low" || value === "Medium" || value === "High" || value === "Critical";
}

function buildPrompt(tickets: ImportedTicket[]) {
  return [
    "You are OpsPilot AI, an operations triage assistant for logistics and admin teams.",
    "Return only valid JSON array. Each item must match this shape:",
    "{ id, category, priority, responsibleTeam, summary, nextAction, draftResponse, confidence }",
    "Allowed categories: Delay, Capacity, Quality, Safety, Documentation, Customer, Other.",
    "Allowed priorities: Low, Medium, High, Critical.",
    "Tickets:",
    JSON.stringify(tickets, null, 2)
  ].join("\n");
}

export function extractJsonPayload(text: string): string {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  return trimmed;
}

async function triageWithOpenAI(tickets: ImportedTicket[]): Promise<TriageResult[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured. Add the key to your environment before running OpenAI triage.");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    temperature: 0.2,
    messages: [
      {
        role: "user",
        content: buildPrompt(tickets)
      }
    ]
  });

  const content = extractJsonPayload(completion.choices[0]?.message.content ?? "[]");
  return normalizeAiResults(tickets, JSON.parse(content));
}

async function triageWithClaude(tickets: ImportedTicket[]): Promise<TriageResult[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured. Add the key to your environment before running Claude triage.");
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
    max_tokens: 2500,
    temperature: 0.2,
    messages: [
      {
        role: "user",
        content: buildPrompt(tickets)
      }
    ]
  });

  const text = message.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();

  return normalizeAiResults(tickets, JSON.parse(extractJsonPayload(text || "[]")));
}

export async function runTriage(request: TriageRequest): Promise<TriageResponse> {
  const results = request.mode === "openai" ? await triageWithOpenAI(request.tickets) : await triageWithClaude(request.tickets);

  return {
    results,
    meta: {
      mode: request.mode,
      processedAt: new Date().toISOString()
    }
  };
}

export function isTriageMode(value: unknown): value is TriageMode {
  return value === "openai" || value === "claude";
}
