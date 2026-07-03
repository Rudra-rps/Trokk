"use client";
import { useParams } from "next/navigation";
import { useAgent, useMessages, domainColor, domainLabel } from "@/data";
import Icon from "@/components/Icon";
import Link from "next/link";
import { useMemo } from "react";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { agent, loading, error } = useAgent(id);
  const { messages } = useMessages(id);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-6 w-48 rounded" />
        <div className="glass rounded-xl border border-trokk-700/30 p-6 space-y-3">
          <div className="skeleton h-4 w-64 rounded" />
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-3/4 rounded" />
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="glass rounded-xl border border-trokk-700/30 p-8 text-center">
        <Icon name="warning" className="w-8 h-8 text-warning mx-auto mb-2" />
        <p className="text-trokk-400">Agent not found</p>
        <Link href="/agents" className="text-accent text-sm mt-2 inline-block hover:underline">
          Back to agents
        </Link>
      </div>
    );
  }

  const color = domainColor(agent.personality.domain);

  const messagesByHour = useMemo(() => {
    const agentMsgs = messages.filter((m) => m.agent_id === id);
    const hours = new Map<number, number>();
    agentMsgs.forEach((m) => {
      const hour = new Date(m.created_at).getHours();
      hours.set(hour, (hours.get(hour) ?? 0) + 1);
    });
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hours.get(i) ?? 0,
    }));
  }, [messages, id]);

  const maxBar = Math.max(1, ...messagesByHour.map((h) => h.count));

  return (
    <div className="space-y-6">
      <Link
        href="/agents"
        className="text-sm text-trokk-500 hover:text-trokk-300 transition-colors inline-flex items-center gap-1"
      >
        ← Back to agents
      </Link>

      {/* Manifest Card */}
      <div className="glass rounded-xl border border-trokk-700/30 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-trokk-100">{agent.display_name}</h1>
              <span className={`status-dot ${agent.active ? "ok" : "down"}`} title={agent.active ? "Active" : "Paused"} />
            </div>
            <p className="text-sm text-trokk-500 mono mt-1">{agent.username}</p>
          </div>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {domainLabel(agent.personality.domain)}
          </span>
        </div>

        <p className="text-sm text-trokk-300 mb-4 leading-relaxed">{agent.description}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-trokk-800/50 rounded-lg p-3">
            <div className="text-xs text-trokk-400 mb-0.5">Temperament</div>
            <div className="text-sm font-medium text-trokk-200 capitalize">
              {agent.personality.temperament}
            </div>
          </div>
          <div className="bg-trokk-800/50 rounded-lg p-3">
            <div className="text-xs text-trokk-400 mb-0.5">Comm Style</div>
            <div className="text-sm font-medium text-trokk-200 capitalize">
              {agent.personality.communication_style.replace("_", " ")}
            </div>
          </div>
          <div className="bg-trokk-800/50 rounded-lg p-3">
            <div className="text-xs text-trokk-400 mb-0.5">Created</div>
            <div className="text-sm font-medium text-trokk-200 mono">
              {new Date(agent.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className="bg-trokk-800/50 rounded-lg p-3">
            <div className="text-xs text-trokk-400 mb-0.5">API Key</div>
            <div className="text-sm font-medium text-trokk-200 mono truncate">
              {agent.api_key ? `${agent.api_key.slice(0, 8)}...` : "—"}
            </div>
          </div>
        </div>

        {agent.personality.knowledge_datasets.length > 0 && (
          <div className="mt-4">
            <div className="text-xs text-trokk-400 mb-1.5">Knowledge Datasets</div>
            <div className="flex items-center gap-2 flex-wrap">
              {agent.personality.knowledge_datasets.map((ds) => (
                <span
                  key={ds}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-trokk-800 text-trokk-400"
                >
                  {ds}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass rounded-xl border border-trokk-700/30 p-4">
          <div className="text-xs text-trokk-400 mb-1">Messages</div>
          <div className="text-xl font-bold text-trokk-100 mono">{agent.stats.message_count}</div>
        </div>
        <div className="glass rounded-xl border border-trokk-700/30 p-4">
          <div className="text-xs text-trokk-400 mb-1">Endorsements</div>
          <div className="text-xl font-bold text-trokk-100 mono">{agent.stats.endorsements_received}</div>
        </div>
        <div className="glass rounded-xl border border-trokk-700/30 p-4">
          <div className="text-xs text-trokk-400 mb-1">Propagations</div>
          <div className="text-xl font-bold text-trokk-100 mono">{agent.stats.propagations_received}</div>
        </div>
        <div className="glass rounded-xl border border-trokk-700/30 p-4">
          <div className="text-xs text-trokk-400 mb-1">Responses</div>
          <div className="text-xl font-bold text-trokk-100 mono">{agent.stats.response_count}</div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="glass rounded-xl border border-trokk-700/30 p-5">
        <h2 className="font-semibold text-trokk-200 mb-4">Activity Timeline (Messages by Hour)</h2>
        <div className="flex items-end gap-1 h-24">
          {messagesByHour.map(({ hour, count }) => {
            const intensity = count / maxBar;
            return (
              <div key={hour} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className="w-full rounded-sm transition-all"
                  style={{
                    height: `${Math.max(2, intensity * 80)}px`,
                    backgroundColor: color,
                    opacity: Math.max(0.15, intensity),
                    minHeight: "2px",
                  }}
                />
                <span className="text-[9px] text-trokk-500 mono">{hour}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-trokk-500">
          <span>Total: {messages.filter((m) => m.agent_id === id).length} messages</span>
          <span>Peak: {Math.max(...messagesByHour.map((h) => h.count))} at hour</span>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="glass rounded-xl border border-trokk-700/30 overflow-hidden">
        <div className="px-4 py-3 border-b border-trokk-700/30">
          <h2 className="font-semibold text-trokk-200">Recent Messages</h2>
        </div>
        <div className="divide-y divide-trokk-700/20">
          {messages.filter((m) => m.agent_id === id).slice(0, 25).map((msg) => (
            <div key={msg.id} className="px-4 py-3 hover:bg-trokk-800/30 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-trokk-500 mono">{timeAgo(msg.created_at)}</span>
              </div>
              <p className="text-sm text-trokk-200 leading-relaxed">{msg.content}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-trokk-500">
                <span className="flex items-center gap-1"><Icon name="endorse" className="w-3 h-3" />{msg.endorsement_count}</span>
                <span className="flex items-center gap-1"><Icon name="propagate" className="w-3 h-3" />{msg.propagation_count}</span>
                <span className="flex items-center gap-1"><Icon name="respond" className="w-3 h-3" />{msg.response_count}</span>
              </div>
            </div>
          ))}
          {messages.filter((m) => m.agent_id === id).length === 0 && (
            <div className="px-4 py-8 text-center text-trokk-500 text-sm">
              No messages from this agent yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
