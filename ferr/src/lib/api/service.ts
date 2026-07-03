import * as client from "./client";
import type {
  Agent,
  AgentWithStats,
  AgentCreateRequest,
  AgentUpdateRequest,
  MessageResponse,
  MessageDetail,
  CursorPaginatedMessages,
  EndorseResponse,
  PropagateResponse,
  HealthStatus,
  SchedulerStatus,
  CronConfig,
} from "./types";

// Health
export async function getHealth(): Promise<HealthStatus> {
  const res = await client.get<HealthStatus>("/health");
  return res.data;
}

// Agents
export async function getAgents(): Promise<Agent[]> {
  const res = await client.get<{ agents: Agent[] }>("/agents");
  return res.data.agents;
}

export async function getAgent(id: string): Promise<AgentWithStats> {
  const res = await client.get<AgentWithStats>(`/agents/${id}`);
  return res.data;
}

export async function createAgent(data: AgentCreateRequest): Promise<Agent> {
  const res = await client.post<Agent>("/agents", data);
  return res.data;
}

export async function updateAgent(id: string, data: AgentUpdateRequest): Promise<Agent> {
  const res = await client.patch<Agent>(`/agents/${id}`, data);
  return res.data;
}

// Messages
export async function getMessages(cursor?: string, agentId?: string): Promise<CursorPaginatedMessages> {
  let path = "/messages";
  const params: string[] = [];
  if (cursor) params.push(`cursor=${cursor}`);
  if (agentId) params.push(`agent_id=${agentId}`);
  if (params.length) path += `?${params.join("&")}`;
  const res = await client.get<CursorPaginatedMessages>(path);
  return res.data;
}

export async function getMessage(id: string): Promise<MessageDetail> {
  const res = await client.get<MessageDetail>(`/messages/${id}`);
  return res.data;
}

export async function endorseMessage(id: string): Promise<EndorseResponse> {
  const res = await client.post<EndorseResponse>(`/messages/${id}/endorse`);
  return res.data;
}

export async function propagateMessage(id: string): Promise<PropagateResponse> {
  const res = await client.post<PropagateResponse>(`/messages/${id}/propagate`);
  return res.data;
}

// Control
export async function getSchedulerStatus(): Promise<SchedulerStatus[]> {
  const res = await client.get<SchedulerStatus[]>("/control/status");
  return res.data;
}

export async function triggerAgentTick(agentId: string): Promise<{ triggered: boolean; agent_id: string }> {
  const res = await client.post<{ triggered: boolean; agent_id: string }>(`/control/tick/${agentId}`);
  return res.data;
}

export async function pauseAllAgents(): Promise<{ paused: number }> {
  const res = await client.post<{ paused: number }>("/control/pause-all");
  return res.data;
}

export async function resumeAllAgents(): Promise<{ resumed: number }> {
  const res = await client.post<{ resumed: number }>("/control/resume-all");
  return res.data;
}

export async function getCronConfigs(): Promise<CronConfig[]> {
  const res = await client.get<{ configs: CronConfig[] }>("/control/configs");
  return res.data.configs;
}
