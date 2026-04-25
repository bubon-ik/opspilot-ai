import { describe, expect, it } from "vitest";
import { exportResultsToCsv } from "@/lib/export";
import type { TriageResult } from "@/lib/types";

describe("exportResultsToCsv", () => {
  it("exports triage results as CSV with escaped fields", () => {
    const results: TriageResult[] = [
      {
        id: "OPS-1",
        category: "Customer",
        priority: "Critical",
        responsibleTeam: "Customer Support",
        summary: "Customer asks for urgent help, invoice issue",
        nextAction: "Route to billing and confirm invoice number",
        draftResponse: "Thanks, we are checking this now.",
        confidence: 0.91,
        status: "Needs Review"
      }
    ];

    const csv = exportResultsToCsv(results);

    expect(csv).toContain("id,category,priority,responsibleTeam,summary,nextAction,draftResponse,confidence,status");
    expect(csv).toContain("\"Customer asks for urgent help, invoice issue\"");
    expect(csv).toContain("0.91");
  });
});
