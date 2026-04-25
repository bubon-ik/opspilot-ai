"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { exportResultsToCsv, exportResultsToJson } from "@/lib/export";
import { parseTicketsCsv } from "@/lib/csv";
import { sampleCsv, sampleTickets } from "@/lib/sample-data";
import type { ImportedTicket, TriageMode, TriageResponse, TriageResult, TriageStatus } from "@/lib/types";

const priorityOrder = ["Critical", "High", "Medium", "Low"] as const;
const statuses: TriageStatus[] = ["New", "Approved", "Needs Review", "Rejected"];

type FilterState = {
  priority: string;
  category: string;
  team: string;
  status: string;
};

const initialFilters: FilterState = {
  priority: "All",
  category: "All",
  team: "All",
  status: "All"
};

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function priorityClass(priority: string) {
  if (priority === "Critical") {
    return "badge badgeCritical";
  }
  if (priority === "High") {
    return "badge badgeHigh";
  }
  if (priority === "Medium") {
    return "badge badgeMedium";
  }
  return "badge badgeLow";
}

function statusClass(status: TriageStatus) {
  if (status === "Approved") {
    return "status statusApproved";
  }
  if (status === "Needs Review") {
    return "status statusReview";
  }
  if (status === "Rejected") {
    return "status statusRejected";
  }
  return "status";
}

export default function Home() {
  const [tickets, setTickets] = useState<ImportedTicket[]>(sampleTickets);
  const [results, setResults] = useState<TriageResult[]>([]);
  const [selectedId, setSelectedId] = useState<string>(sampleTickets[0]?.id ?? "");
  const [mode, setMode] = useState<TriageMode>("demo");
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessedAt, setLastProcessedAt] = useState("");

  const selectedTicket = tickets.find((ticket) => ticket.id === selectedId) ?? tickets[0];
  const selectedResult = results.find((result) => result.id === selectedTicket?.id);

  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      return (
        (filters.priority === "All" || result.priority === filters.priority) &&
        (filters.category === "All" || result.category === filters.category) &&
        (filters.team === "All" || result.responsibleTeam === filters.team) &&
        (filters.status === "All" || result.status === filters.status)
      );
    });
  }, [filters, results]);

  const categories = useMemo(() => Array.from(new Set(results.map((result) => result.category))).sort(), [results]);
  const teams = useMemo(() => Array.from(new Set(results.map((result) => result.responsibleTeam))).sort(), [results]);

  const metrics = useMemo(() => {
    const critical = results.filter((result) => result.priority === "Critical").length;
    const high = results.filter((result) => result.priority === "High").length;
    const review = results.filter((result) => result.status === "Needs Review" || result.status === "New").length;
    const avgConfidence =
      results.length === 0 ? 0 : Math.round((results.reduce((sum, result) => sum + result.confidence, 0) / results.length) * 100);

    return {
      total: results.length,
      critical,
      high,
      review,
      avgConfidence
    };
  }, [results]);

  async function runAiTriage(nextMode = mode) {
    setError("");
    setIsProcessing(true);

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tickets,
          mode: nextMode
        })
      });

      const payload = (await response.json()) as TriageResponse | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Triage request failed.");
      }

      setResults(payload.results);
      setSelectedId(payload.results[0]?.id ?? tickets[0]?.id ?? "");
      setLastProcessedAt(payload.meta.processedAt);
      setFilters(initialFilters);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to process tickets.");
    } finally {
      setIsProcessing(false);
    }
  }

  function handleSampleData() {
    setTickets(sampleTickets);
    setResults([]);
    setSelectedId(sampleTickets[0]?.id ?? "");
    setError("");
    setFilters(initialFilters);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    const parsed = parseTicketsCsv(text);

    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setTickets(parsed.tickets);
    setResults([]);
    setSelectedId(parsed.tickets[0]?.id ?? "");
    setError("");
    setFilters(initialFilters);
  }

  function updateStatus(id: string, status: TriageStatus) {
    setResults((current) => current.map((result) => (result.id === id ? { ...result, status } : result)));
  }

  function updateFilter(key: keyof FilterState, value: string) {
    setFilters((current) => ({
      ...current,
      [key]: value
    }));
  }

  return (
    <main className="appShell">
      <nav className="commandNav" aria-label="OpsPilot navigation">
        <a className="brandMark" href="#queue">
          <span>OP</span>
          OpsPilot AI
        </a>
        <div className="navStatus">
          <span className="liveDot" />
          Portfolio demo
        </div>
        <a className="navLink" href="#docs">
          Setup notes
        </a>
      </nav>

      <section className="topbar">
        <div>
          <p className="eyebrow">Operations command layer</p>
          <h1>AI workflow triage dashboard for operations teams</h1>
          <p className="lede">
            Import operational tickets, classify them with demo or real AI processing, then review priority, ownership,
            next action, and draft response in one focused dashboard.
          </p>
          <div className="signalLine" aria-label="Workflow summary">
            <span>CSV intake</span>
            <span>AI triage</span>
            <span>Human review</span>
            <span>Export</span>
          </div>
        </div>
        <div className="commandCard">
          <span className="commandCardLabel">Active workflow</span>
          <strong>{tickets.length} tickets queued</strong>
          <p>Use sample operations data or upload a CSV with the required columns.</p>
          <div className="topbarActions">
            <label className="fileButton">
              Upload CSV
              <input accept=".csv,text/csv" type="file" onChange={handleFileChange} />
            </label>
            <button className="ghostButton" type="button" onClick={handleSampleData}>
              Load sample data
            </button>
          </div>
        </div>
      </section>

      <section className="controlStrip" aria-label="Triage controls">
        <div className="modeGroup" aria-label="AI mode">
          {(["demo", "openai", "claude"] as TriageMode[]).map((option) => (
            <button
              className={mode === option ? "modeButton active" : "modeButton"}
              key={option}
              type="button"
              onClick={() => setMode(option)}
            >
              {option === "demo" ? "Demo mode" : option === "openai" ? "OpenAI" : "Claude"}
            </button>
          ))}
        </div>
        <button className="primaryButton" disabled={isProcessing || tickets.length === 0} type="button" onClick={() => runAiTriage()}>
          {isProcessing ? "Processing tickets" : "Run AI triage"}
        </button>
        {lastProcessedAt ? <span className="processedAt">Last run {formatDate(lastProcessedAt)}</span> : null}
      </section>

      {error ? <div className="errorPanel">{error}</div> : null}

      <section className="metricsGrid" aria-label="Triage metrics">
        <article>
          <span>Total tickets</span>
          <strong>{metrics.total || tickets.length}</strong>
        </article>
        <article>
          <span>Critical</span>
          <strong>{metrics.critical}</strong>
        </article>
        <article>
          <span>High priority</span>
          <strong>{metrics.high}</strong>
        </article>
        <article>
          <span>Needs review</span>
          <strong>{metrics.review}</strong>
        </article>
        <article>
          <span>Avg confidence</span>
          <strong>{metrics.avgConfidence}%</strong>
        </article>
      </section>

      <section className="workspaceGrid" id="queue">
        <div className="panel tablePanel">
          <div className="panelHeader">
            <div>
              <h2>Triage queue</h2>
              <p>{results.length ? `${filteredResults.length} of ${results.length} AI results` : `${tickets.length} imported tickets ready`}</p>
            </div>
            <div className="exportGroup">
              <button
                className="smallButton"
                disabled={results.length === 0}
                type="button"
                onClick={() => downloadFile("opspilot-results.csv", exportResultsToCsv(results), "text/csv")}
              >
                Export CSV
              </button>
              <button
                className="smallButton"
                disabled={results.length === 0}
                type="button"
                onClick={() => downloadFile("opspilot-results.json", exportResultsToJson(results), "application/json")}
              >
                Export JSON
              </button>
            </div>
          </div>

          <div className="filters" aria-label="Queue filters">
            <span className="filterLabel">Filter queue</span>
            <select value={filters.priority} onChange={(event) => updateFilter("priority", event.target.value)}>
              <option>All</option>
              {priorityOrder.map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
            <select value={filters.category} onChange={(event) => updateFilter("category", event.target.value)}>
              <option>All</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
            <select value={filters.team} onChange={(event) => updateFilter("team", event.target.value)}>
              <option>All</option>
              {teams.map((team) => (
                <option key={team}>{team}</option>
              ))}
            </select>
            <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
              <option>All</option>
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Team</th>
                  <th>Status</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {(results.length ? filteredResults : tickets).map((item) => {
                  const result = "priority" in item ? item : undefined;
                  const ticket = tickets.find((candidate) => candidate.id === item.id);

                  return (
                    <tr
                      className={selectedId === item.id ? "selectedRow" : ""}
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <td>
                        <strong>{ticket?.title ?? item.id}</strong>
                        <span>{item.id}</span>
                      </td>
                      <td>{result ? result.category : "Ready"}</td>
                      <td>{result ? <span className={priorityClass(result.priority)}>{result.priority}</span> : "Pending"}</td>
                      <td>{result ? result.responsibleTeam : ticket?.source}</td>
                      <td>{result ? <span className={statusClass(result.status)}>{result.status}</span> : "Not processed"}</td>
                      <td>{result ? `${Math.round(result.confidence * 100)}%` : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="panel detailPanel">
          <div className="panelHeader">
            <div>
              <h2>Triage inspector</h2>
              <p>{selectedTicket ? `${selectedTicket.id} from ${selectedTicket.source}` : "Select a ticket"}</p>
            </div>
          </div>

          {selectedTicket ? (
            <div className="detailStack">
              <section>
                <span className="sectionLabel">Original request</span>
                <h3>{selectedTicket.title}</h3>
                <p>{selectedTicket.description}</p>
                <small>Created {formatDate(selectedTicket.createdAt)}</small>
              </section>

              {selectedResult ? (
                <>
                  <section className="aiSummary">
                    <span className="sectionLabel">AI summary</span>
                    <p>{selectedResult.summary}</p>
                  </section>
                  <section className="recommendation">
                    <span className="sectionLabel">Recommended next action</span>
                    <p>{selectedResult.nextAction}</p>
                  </section>
                  <section className="draftResponse">
                    <span className="sectionLabel">Draft response</span>
                    <p>{selectedResult.draftResponse}</p>
                  </section>
                  <div className="reviewActions">
                    <button type="button" onClick={() => updateStatus(selectedResult.id, "Approved")}>
                      Approve
                    </button>
                    <button type="button" onClick={() => updateStatus(selectedResult.id, "Needs Review")}>
                      Needs Review
                    </button>
                    <button type="button" onClick={() => updateStatus(selectedResult.id, "Rejected")}>
                      Reject
                    </button>
                  </div>
                </>
              ) : (
                <div className="emptyState">
                  Run AI triage to generate category, priority, owner, next action, and draft response for this ticket.
                </div>
              )}
            </div>
          ) : (
            <div className="emptyState">Upload a CSV or load the sample dataset to begin.</div>
          )}
        </aside>
      </section>

      <section className="docsPanel" id="docs">
        <div>
          <h2>Demo setup and API behavior</h2>
          <p>
            Demo mode is deterministic and works without credentials. Real mode uses server-side environment variables and
            keeps imported tickets available if the AI request fails.
          </p>
        </div>
        <div className="docsGrid">
          <article>
            <h3>CSV format</h3>
            <code>id,title,description,source,createdAt</code>
          </article>
          <article>
            <h3>OpenAI</h3>
            <code>OPENAI_API_KEY</code>
          </article>
          <article>
            <h3>Claude</h3>
            <code>ANTHROPIC_API_KEY</code>
          </article>
          <article>
            <h3>Endpoint</h3>
            <code>POST /api/triage</code>
          </article>
        </div>
        <a className="sampleLink" href="/sample-tickets.csv" download>
          Download sample CSV
        </a>
      </section>
    </main>
  );
}
