"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import * as api from "./service";
import { getPollingInterval, subscribe } from "@/lib/polling";
import type {
  Agent,
  AgentWithStats,
  AgentCreateRequest,
  AgentUpdateRequest,
  MessageResponse,
  MessageDetail,
  CursorPaginatedMessages,
  HealthStatus,
  SchedulerStatus,
  CronConfig,
} from "./types";

// --- Health ---

export function useHealth() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout>;

    const fetch = () => {
      api
        .getHealth()
        .then((data) => { if (active) { setHealth(data); setError(null); } })
        .catch((e: any) => { if (active) setError(e.message); })
        .finally(() => { if (active) { setLoading(false); schedule(); } });
    };

    const schedule = () => {
      if (!active) return;
      timeout = setTimeout(fetch, getPollingInterval("health"));
    };

    const unsub = subscribe(() => {
      clearTimeout(timeout);
      schedule();
    });

    fetch();

    return () => {
      active = false;
      clearTimeout(timeout);
      unsub();
    };
  }, []);

  return { health, loading, error };
}

// --- Agents ---

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    api
      .getAgents()
      .then((data) => { setAgents(data); setError(null); })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout>;

    const schedule = () => {
      if (!active) return;
      timeout = setTimeout(() => { fetch(); schedule(); }, getPollingInterval("agents"));
    };

    const unsub = subscribe(schedule);

    fetch();
    schedule();

    return () => {
      active = false;
      clearTimeout(timeout);
      unsub();
    };
  }, [fetch]);

  return { agents, loading, error, refresh: fetch };
}

export function useAgent(id: string) {
  const [agent, setAgent] = useState<AgentWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    if (!id) return;
    setLoading(true);
    api
      .getAgent(id)
      .then((data) => { setAgent(data); setError(null); })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let active = true;
    let timeout: ReturnType<typeof setTimeout>;

    const schedule = () => {
      if (!active) return;
      timeout = setTimeout(() => { fetch(); schedule(); }, getPollingInterval("agents"));
    };

    const unsub = subscribe(schedule);
    fetch();
    schedule();

    return () => {
      active = false;
      clearTimeout(timeout);
      unsub();
    };
  }, [fetch, id]);

  return { agent, loading, error, refresh: fetch };
}

export function useCreateAgent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (data: AgentCreateRequest): Promise<Agent | null> => {
    setLoading(true);
    setError(null);
    try {
      const agent = await api.createAgent(data);
      return agent;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}

export function useUpdateAgent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (id: string, data: AgentUpdateRequest): Promise<Agent | null> => {
    setLoading(true);
    setError(null);
    try {
      const agent = await api.updateAgent(id, data);
      return agent;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { update, loading, error };
}

// --- Messages ---

export function useMessages(agentId?: string) {
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLatest = useCallback(() => {
    api
      .getMessages(undefined, agentId)
      .then((data) => {
        setMessages(data.messages);
        setNextCursor(data.next_cursor);
        setHasMore(data.has_more);
        setError(null);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [agentId]);

  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout>;

    setLoading(true);
    fetchLatest();

    const schedule = () => {
      if (!active) return;
      timeout = setTimeout(() => { fetchLatest(); schedule(); }, getPollingInterval("stream"));
    };

    const unsub = subscribe(schedule);
    schedule();

    return () => {
      active = false;
      clearTimeout(timeout);
      unsub();
    };
  }, [fetchLatest]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || !hasMore) return;
    const data = await api.getMessages(nextCursor, agentId);
    setMessages((prev) => [...prev, ...data.messages]);
    setNextCursor(data.next_cursor);
    setHasMore(data.has_more);
  }, [nextCursor, hasMore, agentId]);

  return { messages, loading, error, nextCursor, hasMore, loadMore, refresh: fetchLatest };
}

export function useMessage(id: string) {
  const [message, setMessage] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .getMessage(id)
      .then((data) => { setMessage(data); setError(null); })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { message, loading, error };
}

// --- Control ---

export function useSchedulerStatus() {
  const [statuses, setStatuses] = useState<SchedulerStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    api
      .getSchedulerStatus()
      .then((data) => { setStatuses(data); setError(null); })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { statuses, loading, error, refresh: fetch };
}

export function useControlActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerTick = async (agentId: string) => {
    setLoading(true);
    try {
      const result = await api.triggerAgentTick(agentId);
      return result;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const pauseAll = async () => {
    setLoading(true);
    try {
      return await api.pauseAllAgents();
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const resumeAll = async () => {
    setLoading(true);
    try {
      return await api.resumeAllAgents();
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { triggerTick, pauseAll, resumeAll, loading, error };
}

// --- Stats (derived from messages for metrics) ---

export function useQuickStats() {
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    totalMessages: 0,
    messagesLastHour: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const agents = await api.getAgents();
        const msgData = await api.getMessages();
        const oneHourAgo = Date.now() - 3600000;
        setStats({
          totalAgents: agents.length,
          activeAgents: agents.filter((a) => a.active).length,
          totalMessages: msgData.messages.length,
          messagesLastHour: msgData.messages.filter(
            (m) => new Date(m.created_at).getTime() > oneHourAgo
          ).length,
        });
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading };
}

// --- Cron Configs ---

export function useCronConfigs() {
  const [configs, setConfigs] = useState<CronConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    api
      .getCronConfigs()
      .then((data) => { setConfigs(data); setError(null); })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { configs, loading, error, refresh: fetch };
}
