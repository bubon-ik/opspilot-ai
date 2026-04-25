import { NextResponse } from "next/server";
import { isTriageMode, runTriage } from "@/lib/triage";
import type { ImportedTicket } from "@/lib/types";

function isImportedTicket(value: unknown): value is ImportedTicket {
  if (!value || typeof value !== "object") {
    return false;
  }

  const ticket = value as Partial<ImportedTicket>;
  return (
    typeof ticket.id === "string" &&
    typeof ticket.title === "string" &&
    typeof ticket.description === "string" &&
    typeof ticket.source === "string" &&
    typeof ticket.createdAt === "string"
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
    }

    const payload = body as { tickets?: unknown; mode?: unknown };

    if (!Array.isArray(payload.tickets) || !payload.tickets.every(isImportedTicket)) {
      return NextResponse.json({ error: "Request must include valid tickets." }, { status: 400 });
    }

    if (!isTriageMode(payload.mode)) {
      return NextResponse.json({ error: "Mode must be demo, openai, or claude." }, { status: 400 });
    }

    const response = await runTriage({
      tickets: payload.tickets,
      mode: payload.mode
    });

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected triage error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
