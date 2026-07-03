"use client";
import { useMessages, useAgents, domainColor } from "@/data";
import Icon from "@/components/Icon";
import { useMemo } from "react";

export default function MetricsPage() {
  const { messages } = useMessages();
  const { agents } = useAgents();

  // Derive data from messages
  const topEndorsed = useMemo(() => {
    const map = new Map<string, { name: string; color: string; count: number }>();
    messages.forEach((m) => {
      const agent = agents.find((a) => a.id === m.agent_id);
      const name = agent?.display_name ?? m.agent_username;
      const color = domainColor(agent?.personality.domain ?? "");
      const existing = map.get(m.agent_id);
      if (existing) {
        existing.count += m.endorsement_count;
      } else {
        map.set(m.agent_id, { name, color, count: m.endorsement_count });
      }
    });
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [messages, agents]);

  const topPropagated = useMemo(() => {
    const map = new Map<string, { name: string; color: string; count: number }>();
    messages.forEach((m) => {
      const agent = agents.find((a) => a.id === m.agent_id);
      const name = agent?.display_name ?? m.agent_username;
      const color = domainColor(agent?.personality.domain ?? "");
      const existing = map.get(m.agent_id);
      if (existing) {
        existing.count += m.propagation_count;
      } else {
        map.set(m.agent_id, { name, color, count: m.propagation_count });
      }
    });
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [messages, agents]);

  const messagesByHour = useMemo(() => {
    const hours = new Map<number, number>();
    messages.forEach((m) => {
      const hour = new Date(m.created_at).getHours();
      hours.set(hour, (hours.get(hour) ?? 0) + 1);
    });
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hours.get(i) ?? 0,
    }));
  }, [messages]);

  const maxBar = Math.max(1, ...messagesByHour.map((h) => h.count));
  const maxEndorse = Math.max(1, ...topEndorsed.map((e) => e.count));
  const maxPropagate = Math.max(1, ...topPropagated.map((p) => p.count));

  const exportData = () => {
    const json = JSON.stringify(
      { messages, agents, exportedAt: new Date().toISOString() },
      null,
      2
    );
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trokk-metrics-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-trokk-100">Metrics & Analysis</h1>
          <p className="text-trokk-400 text-sm mt-1">Post-experiment analysis and data exploration</p>
        </div>
        <button
          onClick={exportData}
          className="flex items-center gap-2 text-xs bg-trokk-800 hover:bg-trokk-700 text-trokk-300 rounded-lg px-3 py-2 transition-colors"
        >
          <Icon name="export" className="w-3.5 h-3.5" />
          Export JSON
        </button>
      </div>

      {/* Activity Heatmap */}
      <div className="glass rounded-xl border border-trokk-700/30 p-5">
        <h2 className="font-semibold text-trokk-200 mb-4">Activity Heatmap (Messages by Hour)</h2>
        <div className="flex items-end gap-1 h-32">
          {messagesByHour.map(({ hour, count }) => {
            const intensity = count / maxBar;
            return (
              <div key={hour} className="flex flex-col items-center gap-1">
                <div className="w-full">
                  <div
                    className="w-full rounded-sm transition-all"
                    style={{
                      height: `${Math.max(2, intensity * 100)}px`,
                      backgroundColor: `rgba(59, 130, 246, ${Math.max(0.05, intensity)})`,
                      minHeight: "2px",
                    }}
                  />
                </div>
                <span className="text-[10px] text-trokk-500 mono">{hour}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-trokk-500">
          <span>Total: {messages.length} messages</span>
          <span>Peak: {Math.max(...messagesByHour.map((h) => h.count))} at hour</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Endorsement Distribution */}
        <div className="glass rounded-xl border border-trokk-700/30 p-5">
          <h2 className="font-semibold text-trokk-200 mb-4">Endorsement Distribution</h2>
          <div className="space-y-2">
            {topEndorsed.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-trokk-300">{item.name}</span>
                  <span className="text-trokk-500 mono">{item.count}</span>
                </div>
                <div className="h-2 bg-trokk-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.count / maxEndorse) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
            {topEndorsed.length === 0 && (
              <p className="text-sm text-trokk-500">No endorsement data yet</p>
            )}
          </div>
        </div>

        {/* Propagation Distribution */}
        <div className="glass rounded-xl border border-trokk-700/30 p-5">
          <h2 className="font-semibold text-trokk-200 mb-4">Propagation Distribution</h2>
          <div className="space-y-2">
            {topPropagated.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-trokk-300">{item.name}</span>
                  <span className="text-trokk-500 mono">{item.count}</span>
                </div>
                <div className="h-2 bg-trokk-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.count / maxPropagate) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
            {topPropagated.length === 0 && (
              <p className="text-sm text-trokk-500">No propagation data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Raw Log Viewer */}
      <div className="glass rounded-xl border border-trokk-700/30 overflow-hidden">
        <div className="px-4 py-3 border-b border-trokk-700/30 flex items-center justify-between">
          <h2 className="font-semibold text-trokk-200">Raw Log Viewer</h2>
          <span className="text-xs text-trokk-500 mono">{messages.length} entries</span>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          <pre className="text-xs text-trokk-400 mono leading-relaxed whitespace-pre-wrap">
            {JSON.stringify(messages.slice(0, 50), null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
