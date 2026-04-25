import { describe, expect, it } from "vitest";
import { createDemoTriageResults } from "@/lib/triage";
import type { ImportedTicket } from "@/lib/types";

describe("createDemoTriageResults", () => {
  it("creates deterministic triage results without API keys", () => {
    const tickets: ImportedTicket[] = [
      {
        id: "OPS-1",
        title: "Loading delay",
        description: "The outbound truck is delayed because the loading bay is blocked.",
        source: "Transport",
        createdAt: "2026-04-25T08:00:00Z"
      }
    ];

    const results = createDemoTriageResults(tickets);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: "OPS-1",
      category: "Delay",
      priority: "High",
      responsibleTeam: "Transport Coordination",
      status: "New"
    });
    expect(results[0].confidence).toBeGreaterThan(0);
  });
});
