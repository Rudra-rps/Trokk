"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "rp_admin";

const headers = () => ({
  "Authorization": `Bearer ${ADMIN_KEY}`,
  "Content-Type": "application/json",
});

interface Investigation {
  id: string;
  question: string;
  status: string;
  created_at: string;
}

interface MessageResponse {
  id: string;
  agent_id: string;
  agent_username: string;
  agent_display_name: string;
  content: string;
  endorsement_count: number;
  propagation_count: number;
  created_at: string;
}

interface Agent {
  id: string;
  username: string;
  display_name: string;
  active: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-muted",
  in_progress: "text-accent",
  consensus: "text-warning",
  complete: "text-success",
  failed: "text-danger",
};

function DashboardContent({ initialQuestion }: { initialQuestion: string }) {
  const router = useRouter();
  const [question, setQuestion] = useState(initialQuestion);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [findings, setFindings] = useState<MessageResponse[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeInv, setActiveInv] = useState<Investigation | null>(null);
  const [polling, setPolling] = useState(false);

  const fetchInvestigations = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/v1/investigations?limit=10`, { headers: headers() });
      const data = await resp.json();
      setInvestigations(data.investigations || []);
      const active = data.investigations?.find((i: Investigation) =>
        ["in_progress", "consensus", "pending"].includes(i.status)
      );
      if (active) setActiveInv(active);
    } catch {}
  }, []);

  const fetchFindings = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/v1/messages?limit=50`, { headers: headers() });
      const data = await resp.json();
      setFindings(data.messages || []);
    } catch {}
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/v1/agents`, { headers: headers() });
      const data = await resp.json();
      setAgents(data.agents || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchInvestigations();
    fetchFindings();
    fetchAgents();
  }, [fetchInvestigations, fetchFindings, fetchAgents]);

  useEffect(() => {
    if (activeInv && ["in_progress", "consensus"].includes(activeInv.status)) {
      setPolling(true);
      const interval = setInterval(() => {
        fetchInvestigations();
        fetchFindings();
      }, 3000);
      return () => {
        clearInterval(interval);
        setPolling(false);
      };
    }
  }, [activeInv?.status, fetchInvestigations, fetchFindings]);

  const startInvestigation = async () => {
    if (!question.trim()) return;
    try {
      const resp = await fetch(`${API_BASE}/api/v1/investigations`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ question: question.trim() }),
      });
      const data = await resp.json();
      setActiveInv(data);
      setQuestion("");
      fetchInvestigations();
    } catch (e) {
      console.error("Failed to create investigation", e);
    }
  };

  const triggerConsensus = async () => {
    if (!activeInv) return;
    try {
      await fetch(`${API_BASE}/api/v1/investigations/${activeInv.id}/consensus`, {
        method: "POST",
        headers: headers(),
      });
      fetchInvestigations();
    } catch {}
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      startInvestigation();
    }
  };

  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
      {/* Question Input */}
      <div className="card p-1 flex gap-2 focus-within:border-accent-border transition-colors">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What do you want to investigate?"
          rows={2}
          className="flex-1 bg-transparent border-none outline-none resize-none text-text placeholder:text-muted text-base px-4 py-3"
        />
        <button
          onClick={startInvestigation}
          disabled={!question.trim()}
          className="self-end px-4 py-2 mb-2 mr-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Investigate →
        </button>
      </div>

      {/* Active Investigation */}
      {activeInv && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${STATUS_COLORS[activeInv.status] || "text-muted"}`}>
                {activeInv.status.replace("_", " ")}
              </span>
              {polling && <span className="text-xs text-muted animate-pulse-subtle">updating live...</span>}
            </div>
            {activeInv.status === "in_progress" && (
              <button
                onClick={triggerConsensus}
                className="text-xs px-3 py-1 border border-accent-border text-accent rounded-lg hover:bg-accent-subtle transition-colors"
              >
                Generate Report
              </button>
            )}
            {activeInv.status === "complete" && (
              <Link
                href={`/reports/${activeInv.id}`}
                className="text-xs px-3 py-1 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                View Report →
              </Link>
            )}
          </div>
          <h2 className="text-lg font-medium text-text mb-4">{activeInv.question}</h2>

          {/* Findings Timeline */}
          <div className="space-y-3">
            {findings.map((f) => {
              const agent = agentMap[f.agent_id];
              return (
                <div key={f.id} className="flex gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-subtle flex items-center justify-center text-xs font-medium text-accent">
                    {agent?.display_name?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-text">
                        {agent?.display_name || f.agent_username}
                      </span>
                      <span className="text-xs text-muted">
                        {new Date(f.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm text-text-secondary whitespace-pre-wrap line-clamp-4">
                      {f.content}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                      <span>✓ {f.endorsement_count}</span>
                      <span>↑ {f.propagation_count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {findings.length === 0 && (
              <p className="text-sm text-muted text-center py-8">
                {activeInv.status === "pending" || activeInv.status === "in_progress"
                  ? "Agents are investigating... findings will appear here."
                  : "No findings yet."}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recent Investigations */}
      {!activeInv && investigations.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-dim mb-3">Recent Investigations</h3>
          <div className="space-y-2">
            {investigations.slice(0, 5).map((inv) => (
              <Link
                key={inv.id}
                href={`/reports/${inv.id}`}
                className="card card-hover p-4 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text truncate">{inv.question}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-xs ml-4 ${STATUS_COLORS[inv.status]}`}>
                  {inv.status.replace("_", " ")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!activeInv && investigations.length === 0 && (
        <div className="text-center py-16">
          <p className="text-dim text-lg">Ask a question to start your first investigation.</p>
          <p className="text-muted text-sm mt-2">
            Research, News, GitHub, Financial, Crypto, OSINT, and more.
          </p>
        </div>
      )}
    </main>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 flex justify-between items-center border-b border-border">
        <Link href="/" className="text-lg font-semibold tracking-tight">Trokk</Link>
        <Link href="/investigations" className="text-sm text-dim hover:text-text transition-colors">
          Past Investigations →
        </Link>
      </header>
      <Suspense fallback={
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
          <div className="card p-8 text-center text-dim">Loading...</div>
        </main>
      }>
        <DashboardInner />
      </Suspense>
    </div>
  );
}

function DashboardInner() {
  const searchParams = useSearchParams();
  const initialQuestion = searchParams.get("q") || "";
  return <DashboardContent initialQuestion={initialQuestion} />;
}
