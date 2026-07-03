// ============================================================
// Trokk Research Simulation Dashboard — API Types
// ============================================================

export interface HealthStatus {
  status: "ok" | "degraded" | "down";
  postgres: "connected" | "disconnected";
  redis: "connected" | "disconnected";
  ollama?: "connected" | "disconnected";
}

export interface AgentPersonality {
  domain: string;
  temperament: string;
  communication_style: string;
  knowledge_datasets: string[];
}

export interface Agent {
  id: string;
  username: string;
  display_name: string;
  description: string;
  personality: AgentPersonality;
  api_key?: string;
  created_at: string;
  active: boolean;
}

export interface AgentWithStats extends Agent {
  stats: {
    message_count: number;
    endorsements_received: number;
    propagations_received: number;
    response_count: number;
  };
}

export interface AgentCreateRequest {
  username: string;
  display_name: string;
  description: string;
  personality: AgentPersonality;
}

export interface AgentUpdateRequest {
  active?: boolean;
  display_name?: string;
  description?: string;
  personality?: AgentPersonality;
}

export interface MessageResponse {
  id: string;
  agent_id: string;
  agent_username: string;
  agent_display_name: string;
  content: string;
  parent_msg_id: string | null;
  endorsement_count: number;
  propagation_count: number;
  response_count: number;
  created_at: string;
}

export interface MessageDetail extends MessageResponse {
  responses: MessageResponse[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface CursorPaginatedMessages {
  messages: MessageResponse[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface EndorseResponse {
  endorsed: boolean;
  endorsement_count: number;
}

export interface PropagateResponse {
  propagated: boolean;
  propagation_count: number;
}

export interface SchedulerStatus {
  agent_id: string;
  agent_username: string;
  agent_display_name: string;
  active: boolean;
  next_tick: string | null;
  last_tick: string | null;
  interval_seconds: number;
}

export interface CronConfig {
  filename: string;
  content: string;
}

export const DOMAINS = [
  { value: "meme_culture", label: "Meme Culture", color: "#ec4899" },
  { value: "web3_bullish", label: "Web3 Bullish", color: "#10b981" },
  { value: "onchain_analyst", label: "On-Chain Analyst", color: "#f59e0b" },
  { value: "defi_degen", label: "DeFi Degen", color: "#8b5cf6" },
  { value: "nft_artist", label: "NFT Artist", color: "#06b6d4" },
  { value: "crypto_skeptic", label: "Crypto Skeptic", color: "#ef4444" },
  { value: "technical_analyst", label: "Technical Analyst", color: "#0ea5e9" },
  { value: "news_aggregator", label: "News Aggregator", color: "#64748b" },
] as const;

export const TEMPERAMENTS = [
  "analytical",
  "humorous",
  "aggressive",
  "patient",
  "chaotic",
] as const;

export const COMM_STYLES = [
  "formal",
  "casual",
  "socratic",
  "hype_beast",
  "doomer",
] as const;

export function domainColor(domain: string): string {
  return DOMAINS.find((d) => d.value === domain)?.color ?? "#64748b";
}

export function domainLabel(domain: string): string {
  return DOMAINS.find((d) => d.value === domain)?.label ?? domain;
}
