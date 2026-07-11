from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field
from typing import Any

import httpx
from langgraph.graph import StateGraph
from langgraph.checkpoint.postgres import PostgresSaver

from config import Config
from openrouter import OpenRouterClient, LLMMessage


@dataclass
class AgentState:
    task_id: uuid.UUID | None = None
    investigation_id: uuid.UUID | None = None
    task_type: str = ""
    task_prompt: str = ""
    system_prompt: str = ""
    research_output: str = ""
    finding_id: uuid.UUID | None = None
    error: str = ""


class BaseAgent:
    """LangGraph agent with plan → research → publish → checkpoint loop."""

    def __init__(self, cfg: Config, name: str, model: str, system_prompt: str):
        self.cfg = cfg
        self.name = name
        self.model = model
        self.system_prompt = system_prompt
        self.mesh = OpenRouterClient(cfg.openrouter_url, cfg.openrouter_api_key)
        self._http = httpx.Client(timeout=30)
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        builder = StateGraph(AgentState)
        builder.add_node("plan", self._plan)
        builder.add_node("research", self._research)
        builder.add_node("publish", self._publish)
        builder.set_entry_point("plan")
        builder.add_edge("plan", "research")
        builder.add_edge("research", "publish")
        return builder.compile()

    def _plan(self, state: AgentState) -> AgentState:
        return state

    def _research(self, state: AgentState) -> AgentState:
        try:
            messages = [
                LLMMessage(role="system", content=self.system_prompt),
                LLMMessage(
                    role="user",
                    content=f"Task: {state.task_prompt}\n\nInvestigation context: you are contributing findings to investigation {state.investigation_id}. Provide detailed, well-sourced research output.",
                ),
            ]
            resp = self.mesh.chat(model=self.model, messages=messages)
            state.research_output = resp.content
        except Exception as exc:
            state.error = str(exc)
        return state

    def _publish(self, state: AgentState) -> AgentState:
        if state.error:
            return state

        try:
            headers = {
                "Authorization": f"Bearer {self.cfg.admin_api_key}",
                "Content-Type": "application/json",
            }

            body = {
                "content": state.research_output,
            }

            if state.investigation_id:
                body["parent_msg_id"] = str(state.investigation_id)

            resp = self._http.post(
                f"{self.cfg.api_base_url}/api/v1/messages",
                headers=headers,
                json=body,
            )
            resp.raise_for_status()
            data = resp.json()
            state.finding_id = uuid.UUID(data["id"])
        except Exception as exc:
            state.error = f"publish_failed: {exc}"

        return state

    def run(self, task_id: uuid.UUID, investigation_id: uuid.UUID, task_prompt: str, checkpoint_saver: PostgresSaver | None = None) -> AgentState:
        initial_state = AgentState(
            task_id=task_id,
            investigation_id=investigation_id,
            task_prompt=task_prompt,
            system_prompt=self.system_prompt,
        )

        config = {"configurable": {"thread_id": str(task_id)}}
        if checkpoint_saver:
            result = self.graph.invoke(initial_state, config)
        else:
            result = self.graph.invoke(initial_state, config)

        return AgentState(**{k: v for k, v in result.items() if k in AgentState.__dataclass_fields__})

    def close(self):
        self.mesh.close()
        self._http.close()
