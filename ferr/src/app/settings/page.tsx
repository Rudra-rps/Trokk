"use client";
import { useState } from "react";
import Icon from "@/components/Icon";
import { getPollingInterval, setPollingInterval } from "@/lib/polling";

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState("http://localhost:8080/api/v1");
  const [apiKey, setApiKey] = useState("trk_admin_dev");
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "fail" | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const [streamInterval, setStreamInterval] = useState(() => String(getPollingInterval("stream")));
  const [healthInterval, setHealthInterval] = useState(() => String(getPollingInterval("health")));
  const [agentsInterval, setAgentsInterval] = useState(() => String(getPollingInterval("agents")));

  // Persist changes to the polling module
  const handleStreamChange = (val: string) => {
    setStreamInterval(val);
    const ms = parseInt(val, 10);
    if (!isNaN(ms)) setPollingInterval("stream", ms);
  };
  const handleHealthChange = (val: string) => {
    setHealthInterval(val);
    const ms = parseInt(val, 10);
    if (!isNaN(ms)) setPollingInterval("health", ms);
  };
  const handleAgentsChange = (val: string) => {
    setAgentsInterval(val);
    const ms = parseInt(val, 10);
    if (!isNaN(ms)) setPollingInterval("agents", ms);
  };

  const testConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch(`${apiUrl}/health`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      setTestResult(res.ok ? "success" : "fail");
    } catch {
      setTestResult("fail");
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-trokk-100">Settings</h1>
        <p className="text-trokk-400 text-sm mt-1">Configure dashboard connection and preferences</p>
      </div>

      {/* API Connection */}
      <div className="glass rounded-xl border border-trokk-700/30 p-5 space-y-4">
        <h2 className="font-semibold text-trokk-200">API Connection</h2>

        <div>
          <label className="block text-xs font-medium text-trokk-400 mb-1">Backend URL</label>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="w-full bg-trokk-800 border border-trokk-700 rounded-lg px-3 py-2 text-sm text-trokk-200 outline-none focus:border-accent mono"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-trokk-400 mb-1">Admin API Key</label>
          <div className="flex items-center gap-2">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 bg-trokk-800 border border-trokk-700 rounded-lg px-3 py-2 text-sm text-trokk-200 outline-none focus:border-accent mono"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="p-2 rounded-lg hover:bg-trokk-700 text-trokk-400 transition-colors"
            >
              <Icon name={showKey ? "close" : "settings"} className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={testConnection}
            disabled={testLoading}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
          >
            {testLoading ? "Testing..." : "Test Connection"}
          </button>
          {testResult === "success" && (
            <span className="flex items-center gap-1 text-xs text-success">
              <Icon name="check" className="w-3.5 h-3.5" />
              Connected
            </span>
          )}
          {testResult === "fail" && (
            <span className="flex items-center gap-1 text-xs text-danger">
              <Icon name="x" className="w-3.5 h-3.5" />
              Failed
            </span>
          )}
        </div>
      </div>

      {/* Polling Intervals */}
      <div className="glass rounded-xl border border-trokk-700/30 p-5 space-y-4">
        <h2 className="font-semibold text-trokk-200">Polling Intervals (ms)</h2>

        <div>
          <label className="block text-xs font-medium text-trokk-400 mb-1">
            Stream Refresh Rate
          </label>
          <input
            type="number"
            value={streamInterval}
            onChange={(e) => handleStreamChange(e.target.value)}
            className="w-full bg-trokk-800 border border-trokk-700 rounded-lg px-3 py-2 text-sm text-trokk-200 outline-none focus:border-accent mono"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-trokk-400 mb-1">
            Health Check Interval
          </label>
          <input
            type="number"
            value={healthInterval}
            onChange={(e) => handleHealthChange(e.target.value)}
            className="w-full bg-trokk-800 border border-trokk-700 rounded-lg px-3 py-2 text-sm text-trokk-200 outline-none focus:border-accent mono"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-trokk-400 mb-1">
            Agent List Interval
          </label>
          <input
            type="number"
            value={agentsInterval}
            onChange={(e) => handleAgentsChange(e.target.value)}
            className="w-full bg-trokk-800 border border-trokk-700 rounded-lg px-3 py-2 text-sm text-trokk-200 outline-none focus:border-accent mono"
          />
        </div>
      </div>

      {/* Theme */}
      <div className="glass rounded-xl border border-trokk-700/30 p-5">
        <h2 className="font-semibold text-trokk-200 mb-3">Theme</h2>
        <div className="flex items-center gap-3">
          <button className="bg-trokk-800 text-trokk-100 border border-accent rounded-lg px-4 py-2 text-sm font-medium">
            Dark Mode
          </button>
          <button className="bg-trokk-950 text-trokk-400 border border-trokk-700 rounded-lg px-4 py-2 text-sm">
            Light Mode
          </button>
        </div>
        <p className="text-xs text-trokk-500 mt-2">Dark mode is the only theme in v1</p>
      </div>
    </div>
  );
}
