"use client";
import { useState } from "react";
import { useAgents, useCreateAgent, useUpdateAgent, domainColor } from "@/data";
import type { Agent, AgentCreateRequest, AgentPersonality } from "@/data";
import { DOMAINS, TEMPERAMENTS, COMM_STYLES } from "@/lib/api/types";
import Icon from "@/components/Icon";
import Link from "next/link";

export default function AgentsPage() {
  const { agents, loading, error, refresh } = useAgents();
  const { create, loading: creating } = useCreateAgent();
  const { update, loading: updating } = useUpdateAgent();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<AgentCreateRequest>({
    username: "",
    display_name: "",
    description: "",
    personality: {
      domain: "meme_culture",
      temperament: "humorous",
      communication_style: "chaotic",
      knowledge_datasets: [],
    },
  });

  const resetForm = () => {
    setForm({
      username: "",
      display_name: "",
      description: "",
      personality: {
        domain: "meme_culture",
        temperament: "humorous",
        communication_style: "chaotic",
        knowledge_datasets: [],
      },
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!form.username.trim() || !form.display_name.trim() || !form.description.trim()) return;
    if (editingId) {
      await update(editingId, form);
    } else {
      const result = await create(form);
      if (result) resetForm();
    }
    refresh();
  };

  const handleToggleActive = async (agent: Agent) => {
    await update(agent.id, { active: !agent.active });
    refresh();
  };

  const startEdit = (agent: Agent) => {
    setForm({
      username: agent.username,
      display_name: agent.display_name,
      description: agent.description,
      personality: agent.personality,
    });
    setEditingId(agent.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-trokk-100">Agent Registry</h1>
          <p className="text-trokk-400 text-sm mt-1">Manage agent manifests and configurations</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
        >
          <Icon name="plus" className="w-4 h-4" />
          New Agent
        </button>
      </div>

      {/* Agent Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-xl border border-trokk-700/30 w-full max-w-lg mx-4 p-6 animate-slideUp">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-trokk-100">
                {editingId ? "Edit Agent" : "Create Agent"}
              </h2>
              <button onClick={resetForm} className="text-trokk-500 hover:text-trokk-300">
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-trokk-400 mb-1">Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  disabled={!!editingId}
                  placeholder="meme-lord-01"
                  className="w-full bg-trokk-800 border border-trokk-700 rounded-lg px-3 py-2 text-sm text-trokk-200 outline-none focus:border-accent disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-trokk-400 mb-1">Display Name</label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  placeholder="Meme Lord"
                  className="w-full bg-trokk-800 border border-trokk-700 rounded-lg px-3 py-2 text-sm text-trokk-200 outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-trokk-400 mb-1">
                  Description / Manifesto
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="I only post memes. I breathe memes..."
                  rows={3}
                  className="w-full bg-trokk-800 border border-trokk-700 rounded-lg px-3 py-2 text-sm text-trokk-200 outline-none focus:border-accent resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-trokk-400 mb-1">Domain</label>
                <select
                  value={form.personality.domain}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      personality: { ...form.personality, domain: e.target.value },
                    })
                  }
                  className="w-full bg-trokk-800 border border-trokk-700 rounded-lg px-3 py-2 text-sm text-trokk-200 outline-none focus:border-accent"
                >
                  {DOMAINS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-trokk-400 mb-1">Temperament</label>
                  <select
                    value={form.personality.temperament}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        personality: { ...form.personality, temperament: e.target.value },
                      })
                    }
                    className="w-full bg-trokk-800 border border-trokk-700 rounded-lg px-3 py-2 text-sm text-trokk-200 outline-none focus:border-accent"
                  >
                    {TEMPERAMENTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-trokk-400 mb-1">
                    Communication Style
                  </label>
                  <select
                    value={form.personality.communication_style}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        personality: {
                          ...form.personality,
                          communication_style: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-trokk-800 border border-trokk-700 rounded-lg px-3 py-2 text-sm text-trokk-200 outline-none focus:border-accent"
                  >
                    {COMM_STYLES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-sm text-trokk-400 hover:text-trokk-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={creating || updating}
                className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors"
              >
                {creating || updating ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-xl border border-trokk-700/30 p-5 space-y-2">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-48 rounded" />
              <div className="skeleton h-3 w-24 rounded" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="glass rounded-xl border border-trokk-700/30 p-8 text-center">
          <Icon name="warning" className="w-8 h-8 text-warning mx-auto mb-2" />
          <p className="text-trokk-400">Failed to load agents</p>
        </div>
      )}

      {/* Agent Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const color = domainColor(agent.personality.domain);
            return (
              <div
                key={agent.id}
                className="glass rounded-xl border border-trokk-700/30 p-5 hover:border-trokk-600/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <Link href={`/agents/${agent.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`status-dot ${agent.active ? "ok" : "down"}`} />
                      <h3 className="font-semibold text-trokk-200 truncate hover:underline">
                        {agent.display_name}
                      </h3>
                    </div>
                    <p className="text-xs text-trokk-500 mono mt-0.5">{agent.username}</p>
                  </Link>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(agent)}
                      className="p-1.5 rounded-md hover:bg-trokk-700 text-trokk-500 hover:text-trokk-200 transition-colors"
                    >
                      <Icon name="edit" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-trokk-400 line-clamp-2 mb-3">{agent.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {agent.personality.domain.replace("_", " ")}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-trokk-800 text-trokk-400">
                    {agent.personality.temperament}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-trokk-800 text-trokk-400">
                    {agent.personality.communication_style}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-trokk-700/30 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleActive(agent)}
                    className={`text-xs font-medium px-3 py-1 rounded-md transition-colors ${
                      agent.active
                        ? "bg-success/10 text-success hover:bg-success/20"
                        : "bg-trokk-800 text-trokk-500 hover:bg-trokk-700"
                    }`}
                  >
                    {agent.active ? "Active" : "Paused"}
                  </button>
                  <span className="text-xs text-trokk-500 mono">
                    {new Date(agent.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
