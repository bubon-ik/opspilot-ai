import type { CsvParseResult, ImportedTicket } from "./types";

const REQUIRED_COLUMNS = ["id", "title", "description", "source", "createdAt"] as const;

function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let insideQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];

    if (char === '"' && insideQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === "," && !insideQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(current.trim());
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current.trim());
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row);
  }

  return rows;
}

export function parseTicketsCsv(csvText: string): CsvParseResult {
  const rows = parseCsvRows(csvText.trim());

  if (rows.length < 2) {
    return {
      ok: false,
      error: "CSV must include a header row and at least one ticket."
    };
  }

  const headers = rows[0].map((header) => header.trim());
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));

  if (missingColumns.length > 0) {
    return {
      ok: false,
      error: `Missing required columns: ${missingColumns.join(", ")}`
    };
  }

  const tickets: ImportedTicket[] = rows.slice(1).map((cells, index) => {
    const record = Object.fromEntries(headers.map((header, headerIndex) => [header, cells[headerIndex] ?? ""]));

    return {
      id: record.id || `OPS-${index + 1}`,
      title: record.title,
      description: record.description,
      source: record.source,
      createdAt: record.createdAt
    };
  });

  const incompleteTicket = tickets.find(
    (ticket) => !ticket.id || !ticket.title || !ticket.description || !ticket.source || !ticket.createdAt
  );

  if (incompleteTicket) {
    return {
      ok: false,
      error: `Ticket ${incompleteTicket.id || "without id"} is missing required field values.`
    };
  }

  return {
    ok: true,
    tickets
  };
}
