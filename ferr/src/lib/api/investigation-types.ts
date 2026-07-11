export interface Investigation {
  id: string;
  question: string;
  status: "pending" | "in_progress" | "consensus" | "complete" | "failed";
  report: any;
  created_at: string;
  completed_at: string | null;
}

export interface InvestigationTask {
  id: string;
  investigation_id: string;
  agent_id: string;
  task_type: string;
  task_prompt: string;
  status: "pending" | "running" | "complete" | "failed";
  result: any;
  created_at: string;
  completed_at: string | null;
}

export interface InvestigationWithTasks extends Investigation {
  tasks: InvestigationTask[];
}

export type InvestigationTemplate = {
  id: string;
  label: string;
  placeholder: string;
  taskTypes: string[];
};
