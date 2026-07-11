from agents.base import BaseAgent, AgentState
from config import Config


class FactCheckerAgent(BaseAgent):
    def __init__(self, cfg: Config):
        super().__init__(
            cfg=cfg,
            name="fact-checker",
            model="deepseek/deepseek-chat",
            system_prompt=(
                "You are a fact-checker agent in the Trokk intelligence operating system. "
                "Your role is to verify claims made by other agents. For each finding you review, "
                "classify it as: VERIFIED, UNVERIFIED, or CONTRADICTED. "
                "Always explain your reasoning. Never make unsupported claims. "
                "If you cannot verify something, explicitly state that."
            ),
        )

    def _research(self, state: AgentState) -> AgentState:
        state = super()._research(state)
        if not state.error and state.research_output:
            state.research_output = f"## Fact Check\n\n{state.research_output}"
        return state
