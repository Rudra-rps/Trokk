"use client";
import { useSchedulerStatus, useControlActions, useAgents, useCronConfigs, domainColor } from "@/data";
import Icon from "@/components/Icon";

function timeAgoOrFuture(iso: string | null): string {
  if (!iso) return "—";
  const diff = new Date(iso).getTime() - Date.now();
  const secs = Math.abs(Math.floor(diff / 1000));
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  return `${Math.floor(secs / 3600)}h`;
}

export default function ControlPage() {
  const { statuses, loading, error, refresh } = useSchedulerStatus();
  const { agents } = useAgents();
  const { configs, loading: configsLoading } = useCronConfigs();
  const { triggerTick, pauseAll, resumeAll, loading: actionLoading } = useControlActions();

  const handlePauseAll = async () => {
    const result = await pauseAll();
    if (result) refresh();
  };

  const handleResumeAll = async () => {
    const result = await resumeAll();
    if (result) refresh();
  };

  const handleTrigger = async (agentId: string) => {
    await triggerTick(agentId);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-trokk-100">Experiment Control</h1>
        <p className="text-trokk-400 text-sm mt-1">Start, stop, and manage the simulation runtime</p>
      </div>

      {/* Bulk Actions */}
      <div className="glass rounded-xl border border-trokk-700/30 p-4 flex items-center gap-4 flex-wrap">
        <span className="text-xs font-medium text-trokk-400 uppercase tracking-wide">Bulk Actions</span>
        <button
          onClick={handleResumeAll}
          disabled={actionLoading}
          className="flex items-center gap-1.5 bg-success/10 text-success hover:bg-success/20 text-sm font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
        >
          <Icon name="play" className="w-3.5 h-3.5" />
          Resume All
        </button>
        <button
          onClick={handlePauseAll}
          disabled={actionLoading}
          className="flex items-center gap-1.5 bg-warning/10 text-warning hover:bg-warning/20 text-sm font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
        >
          <Icon name="pause" className="w-3.5 h-3.5" />
          Pause All
        </button>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 text-trokk-400 hover:text-trokk-200 text-sm rounded-lg px-4 py-2 transition-colors"
        >
          <Icon name="refresh" className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass rounded-xl border border-trokk-700/30 p-4 space-y-2">
              <div className="skeleton h-3 w-32 rounded" />
              <div className="skeleton h-2 w-48 rounded" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="glass rounded-xl border border-trokk-700/30 p-8 text-center">
          <Icon name="warning" className="w-8 h-8 text-warning mx-auto mb-2" />
          <p className="text-trokk-400">Failed to load scheduler status</p>
        </div>
      )}

      {/* Scheduler Status */}
      {!loading && !error && (
        <div className="glass rounded-xl border border-trokk-700/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-trokk-700/30 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-trokk-400 uppercase">Agent</th>
                  <th className="px-4 py-3 text-xs font-medium text-trokk-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-trokk-400 uppercase hidden sm:table-cell">
                    Interval
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-trokk-400 uppercase hidden sm:table-cell">
                    Last Tick
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-trokk-400 uppercase hidden sm:table-cell">
                    Next Tick
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-trokk-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trokk-700/20">
                {statuses.map((status) => {
                  const agent = agents.find((a) => a.id === status.agent_id);
                  const color = domainColor(agent?.personality.domain ?? "");
                  return (
                    <tr key={status.agent_id} className="hover:bg-trokk-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-medium text-trokk-200">{status.agent_display_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            status.active
                              ? "bg-success/10 text-success"
                              : "bg-trokk-800 text-trokk-500"
                          }`}
                        >
                          {status.active ? "Active" : "Paused"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-trokk-400 mono text-xs hidden sm:table-cell">
                        {status.interval_seconds}s
                      </td>
                      <td className="px-4 py-3 text-trokk-400 mono text-xs hidden sm:table-cell">
                        {status.last_tick ? timeAgoOrFuture(status.last_tick) + " ago" : "—"}
                      </td>
                      <td className="px-4 py-3 text-trokk-400 mono text-xs hidden sm:table-cell">
                        {status.next_tick ? `in ${timeAgoOrFuture(status.next_tick)}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleTrigger(status.agent_id)}
                          disabled={!status.active || actionLoading}
                          className="flex items-center gap-1 text-xs bg-accent/10 text-accent hover:bg-accent/20 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Icon name="play" className="w-3 h-3" />
                          <span className="hidden sm:inline">Tick</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cron Config Viewer */}
      <div className="glass rounded-xl border border-trokk-700/30 overflow-hidden">
        <div className="px-4 py-3 border-b border-trokk-700/30 flex items-center justify-between">
          <h2 className="font-semibold text-trokk-200">Agent Config Files</h2>
          <span className="text-xs text-trokk-500 mono">
            {configsLoading ? "Loading..." : `${configs.length} files`}
          </span>
        </div>
        {configsLoading && (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-20 w-full rounded" />
            ))}
          </div>
        )}
        {!configsLoading && configs.length > 0 && (
          <div className="divide-y divide-trokk-700/20">
            {configs.map((cfg) => (
              <details key={cfg.filename} className="group">
                <summary className="px-4 py-3 cursor-pointer hover:bg-trokk-800/30 transition-colors flex items-center gap-2 text-sm text-trokk-300">
                  <Icon name="chevron-right" className="w-3.5 h-3.5 transition-transform group-open:rotate-90 text-trokk-500" />
                  <span className="mono text-xs">{cfg.filename}</span>
                </summary>
                <pre className="px-6 py-3 bg-trokk-950/50 text-xs text-trokk-400 mono leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">
                  {cfg.content}
                </pre>
              </details>
            ))}
          </div>
        )}
        {!configsLoading && configs.length === 0 && (
          <div className="px-4 py-8 text-center text-trokk-500 text-sm">
            No config files found in configs/agents/
          </div>
        )}
      </div>
    </div>
  );
}
