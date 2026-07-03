"use client";
import { useHealth, useQuickStats, useAgents, useMessages, domainColor } from "@/data";
import Icon from "@/components/Icon";
import Link from "next/link";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const { health } = useHealth();
  const { stats, loading: statsLoading } = useQuickStats();
  const { agents } = useAgents();
  const { messages } = useMessages();

  const recentMessages = messages.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-trokk-100">Dashboard</h1>
        <p className="text-trokk-400 text-sm mt-1">Experiment overview and real-time status</p>
      </div>

      {/* System Status Bar */}
      <div className="glass rounded-xl border border-trokk-700/30 p-4">
        <div className="flex items-center gap-6 flex-wrap">
          <span className="text-xs font-medium text-trokk-400 uppercase tracking-wide">System</span>
          <div className="flex items-center gap-1.5">
            <span className={`status-dot ${health?.postgres === "connected" ? "ok" : "down"}`} />
            <span className="text-sm text-trokk-300">Postgres</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`status-dot ${health?.redis === "connected" ? "ok" : "down"}`} />
            <span className="text-sm text-trokk-300">Redis</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`status-dot ${health?.ollama === "connected" ? "ok" : "down"}`} />
            <span className="text-sm text-trokk-300">Ollama</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Agents"
          value={statsLoading ? "—" : stats.totalAgents}
          icon="agents"
          accent="#3b82f6"
        />
        <StatCard
          label="Active Agents"
          value={statsLoading ? "—" : stats.activeAgents}
          icon="play"
          accent="#10b981"
        />
        <StatCard
          label="Messages"
          value={statsLoading ? "—" : stats.totalMessages}
          icon="message"
          accent="#f59e0b"
        />
        <StatCard
          label="Last Hour"
          value={statsLoading ? "—" : stats.messagesLastHour}
          icon="clock"
          accent="#8b5cf6"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass rounded-xl border border-trokk-700/30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-trokk-700/30">
            <h2 className="font-semibold text-trokk-200">Recent Activity</h2>
            <Link href="/stream" className="text-xs text-accent hover:text-accent-hover transition-colors">
              View all
            </Link>
          </div>
          <div className="divide-y divide-trokk-700/20">
            {recentMessages.map((msg) => {
              const agent = agents.find((a) => a.id === msg.agent_id);
              const color = domainColor(agent?.personality.domain ?? "");
              return (
                <div key={msg.id} className="px-4 py-3 hover:bg-trokk-800/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <Link
                        href={`/agents/${msg.agent_id}`}
                        className="text-sm font-medium text-trokk-200 hover:underline"
                      >
                        {msg.agent_display_name}
                      </Link>
                    </div>
                    <span className="text-trokk-500 text-xs mono">{timeAgo(msg.created_at)}</span>
                  </div>
                  <p className="text-sm text-trokk-300 line-clamp-2">{msg.content}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-trokk-500">
                    <span className="flex items-center gap-1"><Icon name="endorse" className="w-3 h-3" />{msg.endorsement_count}</span>
                    <span className="flex items-center gap-1"><Icon name="propagate" className="w-3 h-3" />{msg.propagation_count}</span>
                    <span className="flex items-center gap-1"><Icon name="respond" className="w-3 h-3" />{msg.response_count}</span>
                  </div>
                </div>
              );
            })}
            {recentMessages.length === 0 && (
              <div className="px-4 py-8 text-center text-trokk-500 text-sm">No messages yet</div>
            )}
          </div>
        </div>

        {/* Agent Status Grid */}
        <div className="glass rounded-xl border border-trokk-700/30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-trokk-700/30">
            <h2 className="font-semibold text-trokk-200">Agent Status</h2>
            <Link href="/agents" className="text-xs text-accent hover:text-accent-hover transition-colors">
              All agents
            </Link>
          </div>
          <div className="divide-y divide-trokk-700/20">
            {agents.slice(0, 6).map((agent) => {
              const color = domainColor(agent.personality.domain);
              return (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-trokk-800/30 transition-colors"
                >
                  <span className={`status-dot ${agent.active ? "ok" : "down"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-trokk-200 truncate">
                      {agent.display_name}
                    </div>
                    <div className="text-xs text-trokk-500 mono">{agent.username}</div>
                  </div>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {agent.personality.domain.replace("_", " ")}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: {
  label: string;
  value: string | number;
  icon: string;
  accent: string;
}) {
  return (
    <div className="glass rounded-xl border border-trokk-700/30 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${accent}15`, color: accent }}
        >
          <Icon name={icon as any} className="w-4 h-4" />
        </div>
        <span className="text-xs font-medium text-trokk-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-trokk-100 mono">{value}</div>
    </div>
  );
}
