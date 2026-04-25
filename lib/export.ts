import type { TriageResult } from "./types";

const EXPORT_HEADERS: Array<keyof TriageResult> = [
  "id",
  "category",
  "priority",
  "responsibleTeam",
  "summary",
  "nextAction",
  "draftResponse",
  "confidence",
  "status",
  "reviewedAt",
  "handoffState"
];

function escapeCsvCell(value: string | number | undefined): string {
  const text = value === undefined ? "" : String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function exportResultsToCsv(results: TriageResult[]): string {
  const rows = results.map((result) => EXPORT_HEADERS.map((header) => escapeCsvCell(result[header])));
  return [EXPORT_HEADERS.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

export function exportResultsToJson(results: TriageResult[]): string {
  return JSON.stringify(results, null, 2);
}
