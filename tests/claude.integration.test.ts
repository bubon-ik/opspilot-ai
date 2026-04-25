import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { runTriage } from "@/lib/triage";
import type { ImportedTicket, TriageCategory, TriagePriority } from "@/lib/types";

const allowedCategories: TriageCategory[] = [
  "Delay",
  "Capacity",
  "Quality",
  "Safety",
  "Documentation",
  "Customer",
  "Other"
];

const allowedPriorities: TriagePriority[] = ["Low", "Medium", "High", "Critical"];

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");

    if (key && value && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const testIfClaudeKeyExists = process.env.ANTHROPIC_API_KEY ? it : it.skip;

const tickets: ImportedTicket[] = [
  {
    id: "OPS-LIVE-1",
    title: "Missing customs document for outbound shipment",
    description:
      "The shipment is ready physically, but the customs document is missing and the truck is scheduled to depart in 40 minutes.",
    source: "Transport Admin",
    createdAt: "2026-04-25T11:00:00Z"
  }
];

describe("Claude integration", () => {
  testIfClaudeKeyExists(
    "processes an operational ticket with the real Claude API",
    async () => {
      process.env.ANTHROPIC_MODEL ||= "claude-sonnet-4-20250514";

      const response = await runTriage({
        mode: "claude",
        tickets
      });

      expect(response.meta.mode).toBe("claude");
      expect(response.results).toHaveLength(1);

      const result = response.results[0];
      expect(result.id).toBe("OPS-LIVE-1");
      expect(allowedCategories).toContain(result.category);
      expect(allowedPriorities).toContain(result.priority);
      expect(result.responsibleTeam.length).toBeGreaterThan(2);
      expect(result.summary.length).toBeGreaterThan(10);
      expect(result.nextAction.length).toBeGreaterThan(10);
      expect(result.draftResponse.length).toBeGreaterThan(10);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.status).toBe("New");
    },
    45_000
  );
});
