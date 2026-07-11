"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";
const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "rp_admin";

const headers = () => ({
  Authorization: `Bearer ${ADMIN_KEY}`,
  "Content-Type": "application/json",
});

interface Agent {
  id: string;
  username: string;
  display_name: string;
  description: string;
  active: boolean;
  created_at: string;
}

export default function SettingsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [form, setForm] = useState({ username: "", display_name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/agents`, { headers: headers() })
      .then((r) => r.json())
      .then((data) => setAgents(data.agents || []))
      .finally(() => setLoading(false));
  }, []);

  const createAgent = async () => {
    if (!form.username || !form.display_name) return;
    setCreating(true);
    try {
      const resp = await fetch(`${API_BASE}/api/v1/agents`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(form),
      });
      const agent = await resp.json();
      setAgents((prev) => [...prev, agent]);
      setForm({ username: "", display_name: "", description: "" });
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (agentId: string, active: boolean) => {
    await fetch(`${API_BASE}/api/v1/agents/${agentId}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ active: !active }),
    });
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, active: !active } : a))
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 flex justify-between items-center border-b border-border">
        <Link href="/" className="text-lg font-semibold tracking-tight">Trokk</Link>
        <Link href="/dashboard" className="text-sm text-dim hover:text-text transition-colors">
          Dashboard →
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-8">
        <h1 className="text-xl font-semibold">Settings</h1>

        {/* Create Agent */}
        <section className="card p-5 space-y-4">
          <h2 className="text-sm font-medium text-dim uppercase tracking-wider">Register Specialist Agent</h2>
          <div className="space-y-3">
            <input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Username (e.g., research-agent)"
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent-border transition-colors"
            />
            <input
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              placeholder="Display name (e.g., Research Agent)"
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent-border transition-colors"
            />
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description (optional)"
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-muted outline-none focus:border-accent-border transition-colors"
            />
          </div>
          <button
            onClick={createAgent}
            disabled={!form.username || !form.display_name || creating}
            className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover disabled:opacity-40 transition-all"
          >
            {creating ? "Creating..." : "Register Agent"}
          </button>
        </section>

        {/* Agent List */}
        <section>
          <h2 className="text-sm font-medium text-dim uppercase tracking-wider mb-3">Registered Agents</h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-4"><div className="skeleton h-4 w-48" /></div>
              ))}
            </div>
          ) : agents.length === 0 ? (
            <p className="text-sm text-muted">No agents registered yet. Register specialist agents above.</p>
          ) : (
            <div className="space-y-2">
              {agents.map((agent) => (
                <div key={agent.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`status-dot ${agent.active ? "ok" : "down"}`} />
                      <span className="text-sm font-medium text-text">{agent.display_name}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5 ml-4">{agent.username} · {agent.description || "No description"}</p>
                  </div>
                  <button
                    onClick={() => toggleActive(agent.id, agent.active)}
                    className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                      agent.active
                        ? "border-success/30 text-success hover:bg-danger-subtle hover:text-danger hover:border-danger/30"
                        : "border-border text-muted hover:bg-success-subtle hover:text-success hover:border-success/30"
                    }`}
                  >
                    {agent.active ? "Active" : "Inactive"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
