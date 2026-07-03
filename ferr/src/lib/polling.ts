// Shared polling intervals — mutable store, read by hooks, written by Settings page

const DEFAULT = { stream: 5000, health: 10000, agents: 30000 };

let intervals = { ...DEFAULT };

type Listener = () => void;
const listeners = new Set<Listener>();

export function getPollingInterval(key: "stream" | "health" | "agents"): number {
  return intervals[key];
}

export function setPollingInterval(key: "stream" | "health" | "agents", ms: number): void {
  intervals[key] = Math.max(1000, ms);
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function usePollingInterval(key: "stream" | "health" | "agents") {
  return getPollingInterval(key);
}
