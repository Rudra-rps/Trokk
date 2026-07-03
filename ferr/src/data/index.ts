export type {
  Agent,
  AgentWithStats,
  AgentCreateRequest,
  AgentUpdateRequest,
  AgentPersonality,
  MessageResponse,
  MessageDetail,
  HealthStatus,
  SchedulerStatus,
  EndorseResponse,
  PropagateResponse,
  CronConfig,
} from "@/lib/api/types";

export {
  DOMAINS,
  TEMPERAMENTS,
  COMM_STYLES,
  domainColor,
  domainLabel,
} from "@/lib/api/types";

export {
  useHealth,
  useAgents,
  useAgent,
  useCreateAgent,
  useUpdateAgent,
  useMessages,
  useMessage,
  useSchedulerStatus,
  useControlActions,
  useQuickStats,
  useCronConfigs,
} from "@/lib/api/hooks";

export { agents as mockAgents, messages as mockMessages } from "@/lib/api/mock";

export const navItems = [
  { icon: "dashboard", label: "Dashboard", href: "/" },
  { icon: "stream", label: "Stream", href: "/stream" },
  { icon: "agents", label: "Agents", href: "/agents" },
  { icon: "metrics", label: "Metrics", href: "/metrics" },
  { icon: "control", label: "Control", href: "/control" },
  { icon: "settings", label: "Settings", href: "/settings" },
];
