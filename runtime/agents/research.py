from agents.base import BaseAgent, AgentState
from config import Config


class ResearchAgent(BaseAgent):
    def __init__(self, cfg: Config):
        super().__init__(
            cfg=cfg,
            name="research-agent",
            model="google/gemini-2.0-flash-001",
            system_prompt=(
                "You are a research specialist agent in the Trokk intelligence operating system. "
                "Your role is to investigate questions using web search, official documentation, "
                "and primary sources. Always cite your sources. Provide structured, factual findings. "
                "Format output as markdown with clear sections: Summary, Key Findings, Sources, Confidence."
            ),
        )

    def _research(self, state: AgentState) -> AgentState:
        state = super()._research(state)
        if not state.error and state.research_output:
            state.research_output = f"## Research Finding\n\n{state.research_output}"
        return state
