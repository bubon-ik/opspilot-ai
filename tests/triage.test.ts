import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/triage/route";
import { extractJsonPayload, isTriageMode, resolveProviderApiKey } from "@/lib/triage";
import type { ImportedTicket } from "@/lib/types";

const tickets: ImportedTicket[] = [
  {
    id: "OPS-1",
    title: "Loading delay",
    description: "The outbound truck is delayed because the loading bay is blocked.",
    source: "Transport",
    createdAt: "2026-04-25T08:00:00Z"
  }
];

describe("isTriageMode", () => {
  it("accepts only real AI provider modes", () => {
    expect(isTriageMode("openai")).toBe(true);
    expect(isTriageMode("claude")).toBe(true);
    expect(isTriageMode("demo")).toBe(false);
  });
});

describe("resolveProviderApiKey", () => {
  it("requires an OpenAI API key for OpenAI mode", async () => {
    const previousKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    expect(() => resolveProviderApiKey("openai")).toThrow("Add your OpenAI API key before running triage.");

    if (previousKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = previousKey;
    }
  });

  it("requires an Anthropic API key for Claude mode", async () => {
    const previousKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    expect(() => resolveProviderApiKey("claude")).toThrow("Add your Claude API key before running triage.");

    if (previousKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = previousKey;
    }
  });

  it("accepts a per-request Claude API key", async () => {
    const previousKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    expect(resolveProviderApiKey("claude", " test-request-key ")).toBe("test-request-key");

    if (previousKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = previousKey;
    }
  });
});

describe("extractJsonPayload", () => {
  it("extracts JSON from a fenced Claude response", () => {
    const payload = extractJsonPayload('```json\n[{"id":"OPS-1","category":"Delay"}]\n```');

    expect(payload).toBe('[{"id":"OPS-1","category":"Delay"}]');
  });
});

describe("POST /api/triage", () => {
  it("rejects the removed demo mode at the API boundary", async () => {
    const response = await POST(
      new Request("http://localhost/api/triage", {
        method: "POST",
        body: JSON.stringify({
          mode: "demo",
          tickets
        })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Mode must be openai or claude."
    });
  });

  it("returns a provider-specific API key error when no key is provided", async () => {
    const previousKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const response = await POST(
      new Request("http://localhost/api/triage", {
        method: "POST",
        body: JSON.stringify({
          mode: "claude",
          tickets
        })
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Add your Claude API key before running triage."
    });

    if (previousKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = previousKey;
    }
  });
});
