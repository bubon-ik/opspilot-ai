export type ImportedTicket = {
  id: string;
  title: string;
  description: string;
  source: string;
  createdAt: string;
};

export type TriageCategory =
  | "Delay"
  | "Capacity"
  | "Quality"
  | "Safety"
  | "Documentation"
  | "Customer"
  | "Other";

export type TriagePriority = "Low" | "Medium" | "High" | "Critical";

export type TriageStatus = "New" | "Approved" | "Needs Review" | "Rejected";

export type TriageResult = {
  id: string;
  category: TriageCategory;
  priority: TriagePriority;
  responsibleTeam: string;
  summary: string;
  nextAction: string;
  draftResponse: string;
  confidence: number;
  status: TriageStatus;
};

export type TriageMode = "openai" | "claude";

export type TriageRequest = {
  tickets: ImportedTicket[];
  mode: TriageMode;
};

export type TriageResponse = {
  results: TriageResult[];
  meta: {
    mode: string;
    processedAt: string;
  };
};

export type CsvParseResult =
  | {
      ok: true;
      tickets: ImportedTicket[];
    }
  | {
      ok: false;
      error: string;
    };
