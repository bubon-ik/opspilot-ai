import { describe, expect, it } from "vitest";
import { exportResultsToCsv, filterResultsForHandoff } from "@/lib/export";
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
        status: "Needs Review",
        reviewedAt: "2026-04-25T15:40:00.000Z",
        handoffState: "Supervisor review"
      }
    ];

    const csv = exportResultsToCsv(results);

    expect(csv).toContain(
      "id,category,priority,responsibleTeam,summary,nextAction,draftResponse,confidence,status,reviewedAt,handoffState"
    );
    expect(csv).toContain("\"Customer asks for urgent help, invoice issue\"");
    expect(csv).toContain("0.91");
    expect(csv).toContain("2026-04-25T15:40:00.000Z");
    expect(csv).toContain("Supervisor review");
  });
});

describe("filterResultsForHandoff", () => {
  it("returns approved, review, and rejected handoff queues", () => {
    const results: TriageResult[] = [
      {
        id: "OPS-1",
        category: "Customer",
        priority: "Critical",
        responsibleTeam: "Customer Support",
        summary: "Customer escalation",
        nextAction: "Send urgent update",
        draftResponse: "We are checking this now.",
        confidence: 0.91,
        status: "Approved",
        reviewedAt: "2026-04-25T15:40:00.000Z",
        handoffState: "Ready for export or downstream handoff"
      },
      {
        id: "OPS-2",
        category: "Safety",
        priority: "Critical",
        responsibleTeam: "Safety Lead",
        summary: "Safety issue",
        nextAction: "Supervisor review",
        draftResponse: "Safety team is reviewing.",
        confidence: 0.94,
        status: "Needs Review",
        reviewedAt: "2026-04-25T15:42:00.000Z",
        handoffState: "Supervisor review"
      },
      {
        id: "OPS-3",
        category: "Other",
        priority: "Low",
        responsibleTeam: "Operations Coordinator",
        summary: "Unclear request",
        nextAction: "Reject recommendation",
        draftResponse: "Needs manual rewrite.",
        confidence: 0.61,
        status: "Rejected",
        reviewedAt: "2026-04-25T15:44:00.000Z",
        handoffState: "AI recommendation rejected"
      }
    ];

    expect(filterResultsForHandoff(results, "approved").map((result) => result.id)).toEqual(["OPS-1"]);
    expect(filterResultsForHandoff(results, "review").map((result) => result.id)).toEqual(["OPS-2"]);
    expect(filterResultsForHandoff(results, "rejected").map((result) => result.id)).toEqual(["OPS-3"]);
  });
});
