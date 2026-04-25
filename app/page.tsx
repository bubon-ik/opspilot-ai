"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { exportResultsToCsv, exportResultsToJson, filterResultsForHandoff, type HandoffQueue } from "@/lib/export";
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

function handoffForStatus(status: TriageStatus) {
  if (status === "Approved") {
    return "Ready for export or downstream handoff";
  }
  if (status === "Needs Review") {
    return "Supervisor review";
  }
  if (status === "Rejected") {
    return "AI recommendation rejected";
  }
  return "Awaiting operator decision";
}

export default function Home() {
  const [tickets, setTickets] = useState<ImportedTicket[]>(sampleTickets);
  const [results, setResults] = useState<TriageResult[]>([]);
  const [selectedId, setSelectedId] = useState<string>(sampleTickets[0]?.id ?? "");
  const [mode, setMode] = useState<TriageMode>("openai");
  const [apiKey, setApiKey] = useState("");
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [error, setError] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const [actionNotice, setActionNotice] = useState("");
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

  const handoffQueues = useMemo(() => {
    return {
      approved: filterResultsForHandoff(results, "approved"),
      review: filterResultsForHandoff(results, "review"),
      rejected: filterResultsForHandoff(results, "rejected")
    };
  }, [results]);

  async function runAiTriage(nextMode = mode) {
    setError("");
    const trimmedApiKey = apiKey.trim();

    if (!trimmedApiKey) {
      setError(nextMode === "openai" ? "Add your OpenAI API key before running triage." : "Add your Claude API key before running triage.");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tickets,
          mode: nextMode,
          apiKey: trimmedApiKey
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
    setResults((current) =>
      current.map((result) =>
        result.id === id
          ? {
              ...result,
              status,
              reviewedAt: new Date().toISOString(),
              handoffState: handoffForStatus(status)
            }
          : result
      )
    );
    setActionNotice(`${id} marked ${status}. Handoff queue updated.`);
    window.setTimeout(() => setActionNotice(""), 2600);
  }

  function updateFilter(key: keyof FilterState, value: string) {
    setFilters((current) => ({
      ...current,
      [key]: value
    }));
  }

  function exportHandoffQueue(queue: HandoffQueue) {
    const queueResults = filterResultsForHandoff(results, queue);
    const filename = `opspilot-${queue}-handoff.csv`;
    downloadFile(filename, exportResultsToCsv(queueResults), "text/csv");
  }

  async function copySlackSummary() {
    const lines = [
      "OpsPilot AI handoff summary",
      `Approved: ${handoffQueues.approved.length}`,
      `Needs supervisor: ${handoffQueues.review.length}`,
      `Rejected: ${handoffQueues.rejected.length}`,
      "",
      ...handoffQueues.approved.slice(0, 5).map((result) => `Approved ${result.id}: ${result.nextAction}`),
      ...handoffQueues.review.slice(0, 5).map((result) => `Needs review ${result.id}: ${result.summary}`)
    ];

    await navigator.clipboard.writeText(lines.join("\n"));
    setCopyNotice("Slack summary copied");
    window.setTimeout(() => setCopyNotice(""), 2200);
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
          Live triage
        </div>
        <a className="navLink" href="#docs">
          Setup notes
        </a>
        <div className="userMenu">
          <UserButton />
        </div>
      </nav>

      <section className="topbar">
        <div>
          <p className="eyebrow">Operations command layer</p>
          <h1>AI workflow triage dashboard for operations teams</h1>
          <p className="lede">
            Import operational tickets, classify them with OpenAI or Claude, then review priority, ownership,
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
          {(["openai", "claude"] as TriageMode[]).map((option) => (
            <button
              className={mode === option ? "modeButton active" : "modeButton"}
              key={option}
              type="button"
              onClick={() => setMode(option)}
            >
              {option === "openai" ? "OpenAI" : "Claude"}
            </button>
          ))}
        </div>
        <label className="apiKeyField">
          <span>{mode === "openai" ? "OpenAI API key" : "Claude API key"}</span>
          <input
            autoComplete="off"
            aria-label={mode === "openai" ? "OpenAI API key" : "Claude API key"}
            placeholder={mode === "openai" ? "sk-..." : "sk-ant-..."}
            spellCheck={false}
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
          <small>Used for this request only. Not stored or exported.</small>
        </label>
        <button className="primaryButton" disabled={isProcessing || tickets.length === 0} type="button" onClick={() => runAiTriage()}>
          {isProcessing ? "Processing tickets" : "Run AI triage"}
        </button>
        {lastProcessedAt ? <span className="processedAt">Last run {formatDate(lastProcessedAt)}</span> : null}
      </section>

      {error ? <div className="errorPanel">{error}</div> : null}
      {actionNotice ? <div className="actionToast">{actionNotice}</div> : null}

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

      <section className="handoffPanel" aria-label="Outbound handoff panel">
        <div>
          <span className="sectionLabel">Outbound handoff</span>
          <h2>Send reviewed work downstream</h2>
          <p>
            Once an operator chooses a review decision, OpsPilot separates tickets into export-ready, supervisor review,
            and rejected queues.
          </p>
        </div>
        <div className="handoffQueues">
          <article>
            <span>Ready to hand off</span>
            <strong>{handoffQueues.approved.length}</strong>
            <button disabled={handoffQueues.approved.length === 0} type="button" onClick={() => exportHandoffQueue("approved")}>
              Export approved
            </button>
          </article>
          <article>
            <span>Needs supervisor</span>
            <strong>{handoffQueues.review.length}</strong>
            <button disabled={handoffQueues.review.length === 0} type="button" onClick={() => exportHandoffQueue("review")}>
              Export review queue
            </button>
          </article>
          <article>
            <span>Rejected</span>
            <strong>{handoffQueues.rejected.length}</strong>
            <button disabled={handoffQueues.rejected.length === 0} type="button" onClick={() => exportHandoffQueue("rejected")}>
              Export rejected
            </button>
          </article>
        </div>
        <div className="handoffActions">
          <button disabled={results.length === 0} type="button" onClick={copySlackSummary}>
            Copy Slack summary
          </button>
          {copyNotice ? <span>{copyNotice}</span> : null}
        </div>
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
              <h2>Decision inspector</h2>
              <p>
                {selectedTicket
                  ? `${selectedTicket.id} from ${selectedTicket.source}. Review the AI recommendation before action.`
                  : "Select a ticket to review the AI decision."}
              </p>
            </div>
          </div>

          {selectedTicket ? (
            <div className="detailStack">
              {selectedResult ? (
                <div className="decisionStrip" aria-label="Selected ticket decision summary">
                  <div>
                    <span>Priority</span>
                    <strong>{selectedResult.priority}</strong>
                  </div>
                  <div>
                    <span>Category</span>
                    <strong>{selectedResult.category}</strong>
                  </div>
                  <div>
                    <span>Owner</span>
                    <strong>{selectedResult.responsibleTeam}</strong>
                  </div>
                  <div>
                    <span>Confidence</span>
                    <strong>{Math.round(selectedResult.confidence * 100)}%</strong>
                  </div>
                  <div>
                    <span>Decision</span>
                    <strong>{selectedResult.handoffState ?? handoffForStatus(selectedResult.status)}</strong>
                  </div>
                </div>
              ) : null}

              <section>
                <span className="sectionLabel">Incoming request</span>
                <h3>{selectedTicket.title}</h3>
                <p>{selectedTicket.description}</p>
                <small>Created {formatDate(selectedTicket.createdAt)}</small>
              </section>

              {selectedResult ? (
                <>
                  <section className="aiSummary">
                    <span className="sectionLabel">What happened</span>
                    <p>{selectedResult.summary}</p>
                  </section>
                  <section className="recommendation">
                    <span className="sectionLabel">What to do next</span>
                    <p>{selectedResult.nextAction}</p>
                  </section>
                  <section className="draftResponse">
                    <span className="sectionLabel">Message draft</span>
                    <p>{selectedResult.draftResponse}</p>
                  </section>
                  <div className="decisionReceipt">
                    <span className={statusClass(selectedResult.status)}>{selectedResult.status}</span>
                    <p>
                      {selectedResult.reviewedAt
                        ? `Reviewed ${formatDate(selectedResult.reviewedAt)}. ${selectedResult.handoffState}.`
                        : "No operator decision yet. Choose an action below to update the queue and export state."}
                    </p>
                  </div>
                  <div className="reviewActions">
                    <button
                      className={selectedResult.status === "Approved" ? "activeReviewAction" : ""}
                      type="button"
                      onClick={() => updateStatus(selectedResult.id, "Approved")}
                    >
                      <strong>Approve</strong>
                      <span>Accept this triage and move the ticket forward.</span>
                    </button>
                    <button
                      className={selectedResult.status === "Needs Review" ? "activeReviewAction" : ""}
                      type="button"
                      onClick={() => updateStatus(selectedResult.id, "Needs Review")}
                    >
                      <strong>Needs Review</strong>
                      <span>Keep it in the queue for a human supervisor.</span>
                    </button>
                    <button
                      className={selectedResult.status === "Rejected" ? "activeReviewAction" : ""}
                      type="button"
                      onClick={() => updateStatus(selectedResult.id, "Rejected")}
                    >
                      <strong>Reject</strong>
                      <span>Mark the AI recommendation as not usable.</span>
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
          <h2>AI setup and API behavior</h2>
          <p>
            OpsPilot uses bring-your-own-key AI requests. The key is sent only for the current triage run,
            never stored in browser state beyond the open page, and never included in exports.
          </p>
        </div>
        <div className="docsGrid">
          <article>
            <h3>CSV format</h3>
            <code>id,title,description,source,createdAt</code>
          </article>
          <article>
            <h3>OpenAI</h3>
            <code>Paste sk-... in the dashboard</code>
          </article>
          <article>
            <h3>Claude</h3>
            <code>Paste sk-ant-... in the dashboard</code>
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
