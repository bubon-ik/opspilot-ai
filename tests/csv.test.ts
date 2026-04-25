import { describe, expect, it } from "vitest";
import { parseTicketsCsv } from "@/lib/csv";

describe("parseTicketsCsv", () => {
  it("parses valid operational tickets from CSV text", () => {
    const csv = [
      "id,title,description,source,createdAt",
      "OPS-1,Truck delayed,\"Carrier reported a 45 minute delay at gate 4\",Transport,2026-04-25T08:00:00Z",
      "OPS-2,Missing document,\"Shipment lacks customs paperwork\",Admin,2026-04-25T09:00:00Z"
    ].join("\n");

    const result = parseTicketsCsv(csv);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tickets).toHaveLength(2);
      expect(result.tickets[0]).toEqual({
        id: "OPS-1",
        title: "Truck delayed",
        description: "Carrier reported a 45 minute delay at gate 4",
        source: "Transport",
        createdAt: "2026-04-25T08:00:00Z"
      });
    }
  });

  it("returns a clear validation error when required columns are missing", () => {
    const result = parseTicketsCsv("id,title,description\nOPS-1,Delay,Truck delayed");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Missing required columns: source, createdAt");
    }
  });
});
