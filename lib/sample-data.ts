import type { ImportedTicket } from "./types";

export const sampleTickets: ImportedTicket[] = [
  {
    id: "OPS-1001",
    title: "Outbound truck delayed at gate 4",
    description: "Carrier reported a 45 minute delay because the loading bay is blocked by another trailer.",
    source: "Transport",
    createdAt: "2026-04-25T08:00:00Z"
  },
  {
    id: "OPS-1002",
    title: "Missing customs paperwork",
    description: "Shipment to Germany is missing customs documents and cannot be marked ready for departure.",
    source: "Admin Desk",
    createdAt: "2026-04-25T08:35:00Z"
  },
  {
    id: "OPS-1003",
    title: "Safety concern near dock 2",
    description: "Operator reported an unsafe spill near dock 2 and asks whether loading should pause.",
    source: "Warehouse",
    createdAt: "2026-04-25T09:05:00Z"
  },
  {
    id: "OPS-1004",
    title: "Customer escalation about late delivery",
    description: "Client requests urgent help because a high-value shipment missed the planned departure.",
    source: "Customer Support",
    createdAt: "2026-04-25T09:40:00Z"
  },
  {
    id: "OPS-1005",
    title: "Capacity issue for afternoon wave",
    description: "The afternoon outbound wave has more volume than planned and may need another vehicle.",
    source: "Shift Planning",
    createdAt: "2026-04-25T10:15:00Z"
  }
];

export const sampleCsv = [
  "id,title,description,source,createdAt",
  ...sampleTickets.map((ticket) =>
    [ticket.id, ticket.title, ticket.description, ticket.source, ticket.createdAt]
      .map((value) => `"${value.replaceAll('"', '""')}"`)
      .join(",")
  )
].join("\n");
