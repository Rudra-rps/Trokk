"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "rp_admin";

const headers = () => ({
  Authorization: `Bearer ${ADMIN_KEY}`,
  "Content-Type": "application/json",
});

interface InvestigationDetail {
  id: string;
  question: string;
  status: string;
  report: any;
  created_at: string;
  completed_at: string | null;
  tasks: {
    id: string;
    agent_id: string;
    task_type: string;
    status: string;
  }[];
}

interface MessageResponse {
  id: string;
  agent_id: string;
  agent_username: string;
  agent_display_name: string;
  content: string;
  endorsement_count: number;
  propagation_count: number;
  response_count: number;
  created_at: string;
  parent_msg_id: string | null;
}

interface Agent {
  id: string;
  display_name: string;
  username: string;
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [inv, setInv] = useState<InvestigationDetail | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`${API_BASE}/api/v1/investigations/${id}`, { headers: headers() }).then((r) => r.json()),
      fetch(`${API_BASE}/api/v1/messages?limit=100`, { headers: headers() }).then((r) => r.json()),
      fetch(`${API_BASE}/api/v1/agents`, { headers: headers() }).then((r) => r.json()),
    ])
      .then(([invData, msgData, agentData]) => {
        setInv(invData);
        setMessages((msgData.messages || []).filter((m: MessageResponse) => m.parent_msg_id === id));
        setAgents(agentData.agents || []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="px-6 py-4 border-b border-border">
          <Link href="/" className="text-lg font-semibold tracking-tight">Trokk</Link>
        </header>
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
          <div className="space-y-4">
            <div className="skeleton h-6 w-1/2" />
            <div className="skeleton h-32 w-full" />
            <div className="skeleton h-20 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!inv) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="px-6 py-4 border-b border-border">
          <Link href="/" className="text-lg font-semibold tracking-tight">Trokk</Link>
        </header>
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
          <p className="text-dim">Report not found.</p>
        </main>
      </div>
    );
  }

  const report = inv.report;
  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 flex justify-between items-center border-b border-border">
        <Link href="/" className="text-lg font-semibold tracking-tight">Trokk</Link>
        <div className="flex gap-3">
          <Link href="/investigations" className="text-sm text-dim hover:text-text transition-colors">
            All Investigations
          </Link>
          <Link href="/dashboard" className="text-sm text-accent hover:text-accent-hover transition-colors">
            New →
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-8">
        <div>
          <span className="text-xs text-success font-medium uppercase tracking-wider">Report</span>
          <h1 className="text-xl font-semibold mt-1">{inv.question}</h1>
        </div>

        {report ? (
          <>
            {/* Executive Summary */}
            <section className="card p-5">
              <h2 className="text-sm font-medium text-dim uppercase tracking-wider mb-3">Executive Summary</h2>
              <p className="text-text-secondary leading-relaxed">{report.executive_summary}</p>
            </section>

            {/* Confidence */}
            {report.confidence_score != null && (
              <section className="card p-5 flex items-center gap-4">
                <div className="text-sm font-medium text-dim uppercase tracking-wider">Confidence</div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${report.confidence_score * 100}%`,
                        backgroundColor:
                          report.confidence_score > 0.7
                            ? "var(--color-success)"
                            : report.confidence_score > 0.4
                            ? "var(--color-warning)"
                            : "var(--color-danger)",
                      }}
                    />
                  </div>
                  <span className="text-sm font-mono text-text">
                    {(report.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
              </section>
            )}

            {/* Key Findings */}
            {report.key_findings?.length > 0 && (
              <section className="card p-5">
                <h2 className="text-sm font-medium text-dim uppercase tracking-wider mb-3">Key Findings</h2>
                <div className="space-y-3">
                  {report.key_findings.map((kf: any, i: number) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg bg-surface-hover">
                      <span className="text-xs font-medium text-accent mt-0.5">
                        {kf.confidence ? `${(kf.confidence * 100).toFixed(0)}%` : ""}
                      </span>
                      <div>
                        <p className="text-sm text-text">{kf.finding}</p>
                        {kf.agent && (
                          <p className="text-xs text-muted mt-1">
                            Source: {kf.agent}
                            {kf.verified && ` · Verified: ${kf.verified}`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Contradictions */}
            {report.contradictions?.length > 0 && (
              <section className="card p-5">
                <h2 className="text-sm font-medium text-warning uppercase tracking-wider mb-3">Contradictions</h2>
                <div className="space-y-3">
                  {report.contradictions.map((c: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg border border-warning/20">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <p className="text-xs text-text-secondary">{c.claim_a}</p>
                        <p className="text-xs text-text-secondary">{c.claim_b}</p>
                      </div>
                      <p className="text-xs text-warning">{c.resolution}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Open Questions */}
            {report.open_questions?.length > 0 && (
              <section className="card p-5">
                <h2 className="text-sm font-medium text-dim uppercase tracking-wider mb-3">Open Questions</h2>
                <ul className="space-y-1.5">
                  {report.open_questions.map((q: string, i: number) => (
                    <li key={i} className="text-sm text-text-secondary flex gap-2">
                      <span className="text-muted">?</span> {q}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Recommendations */}
            {report.recommendations?.length > 0 && (
              <section className="card p-5">
                <h2 className="text-sm font-medium text-dim uppercase tracking-wider mb-3">Recommendations</h2>
                <ul className="space-y-1.5">
                  {report.recommendations.map((r: string, i: number) => (
                    <li key={i} className="text-sm text-text-secondary flex gap-2">
                      <span className="text-accent">→</span> {r}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : (
          <div className="text-center py-12 card">
            <p className="text-dim">
              {inv.status === "in_progress"
                ? "Investigation is in progress. The report will be generated once agents complete their findings."
                : inv.status === "consensus"
                ? "Generating consensus report..."
                : "No report yet."}
            </p>
          </div>
        )}

        {/* Agent Findings */}
        {messages.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-dim uppercase tracking-wider mb-3">Agent Findings</h2>
            <div className="space-y-3">
              {messages.map((m) => {
                const agent = agentMap[m.agent_id];
                return (
                  <div key={m.id} className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-accent-subtle flex items-center justify-center text-xs font-medium text-accent">
                        {agent?.display_name?.[0] || "?"}
                      </div>
                      <span className="text-sm font-medium text-text">
                        {agent?.display_name || m.agent_username}
                      </span>
                      <span className="text-xs text-muted ml-auto">
                        {new Date(m.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-text-secondary whitespace-pre-wrap">
                      {m.content}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                      <span>✓ {m.endorsement_count} verified</span>
                      <span>↑ {m.propagation_count} escalated</span>
                      <span>↩ {m.response_count} responses</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
