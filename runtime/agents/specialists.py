from agents.base import BaseAgent, AgentState
from config import Config


class NewsAgent(BaseAgent):
    def __init__(self, cfg: Config):
        super().__init__(
            cfg=cfg,
            name="news-agent",
            model="llama3.2:3b",
            system_prompt=(
                "You are a news analyst agent in the Trokk intelligence operating system. "
                "Your role is to gather and analyze news articles, press releases, and media coverage. "
                "Track sentiment, identify key narratives, and report on media framing. "
                "Format output with: Headlines, Sentiment Analysis, Key Narratives, Sources."
            ),
        )

    def _research(self, state: AgentState) -> AgentState:
        state = super()._research(state)
        if not state.error and state.research_output:
            state.research_output = f"## News Analysis\n\n{state.research_output}"
        return state


class RedditAgent(BaseAgent):
    def __init__(self, cfg: Config):
        super().__init__(
            cfg=cfg,
            name="reddit-agent",
            model="llama3.2:3b",
            system_prompt=(
                "You are a community intelligence agent in the Trokk intelligence operating system. "
                "Your role is to analyze community discussions, sentiment, FAQs, and user perspectives. "
                "Report on prevailing opinions, controversies, and community consensus. "
                "Format output with: Community Sentiment, Top Discussions, Common Questions, Red Flags."
            ),
        )

    def _research(self, state: AgentState) -> AgentState:
        state = super()._research(state)
        if not state.error and state.research_output:
            state.research_output = f"## Community Intelligence\n\n{state.research_output}"
        return state


class GitHubAgent(BaseAgent):
    def __init__(self, cfg: Config):
        super().__init__(
            cfg=cfg,
            name="github-agent",
            model="llama3.2:3b",
            system_prompt=(
                "You are a repository analyst agent in the Trokk intelligence operating system. "
                "Your role is to analyze GitHub repositories: commit patterns, contributor activity, "
                "issue velocity, code quality signals, and community health. "
                "Report on: Activity Level, Contributor Diversity, Issue Health, Code Quality Indicators, Release Cadence."
            ),
        )

    def _research(self, state: AgentState) -> AgentState:
        state = super()._research(state)
        if not state.error and state.research_output:
            state.research_output = f"## Repository Analysis\n\n{state.research_output}"
        return state


class FinancialAgent(BaseAgent):
    def __init__(self, cfg: Config):
        super().__init__(
            cfg=cfg,
            name="financial-agent",
            model="llama3.2:3b",
            system_prompt=(
                "You are a financial analyst agent in the Trokk intelligence operating system. "
                "Your role is to analyze company financials: revenue trends, funding history, "
                "valuation metrics, market position, and competitive landscape. "
                "Report with: Revenue Analysis, Funding History, Valuation, Market Position, Risk Factors."
            ),
        )

    def _research(self, state: AgentState) -> AgentState:
        state = super()._research(state)
        if not state.error and state.research_output:
            state.research_output = f"## Financial Analysis\n\n{state.research_output}"
        return state


class CryptoAgent(BaseAgent):
    def __init__(self, cfg: Config):
        super().__init__(
            cfg=cfg,
            name="crypto-agent",
            model="llama3.2:3b",
            system_prompt=(
                "You are a cryptocurrency analyst agent in the Trokk intelligence operating system. "
                "Your role is to analyze crypto projects: tokenomics, on-chain metrics, "
                "liquidity depth, protocol security, and ecosystem health. "
                "Report with: Tokenomics, On-Chain Metrics, Liquidity Analysis, Protocol Security, Ecosystem Health."
            ),
        )

    def _research(self, state: AgentState) -> AgentState:
        state = super()._research(state)
        if not state.error and state.research_output:
            state.research_output = f"## Crypto Analysis\n\n{state.research_output}"
        return state


class OsintAgent(BaseAgent):
    def __init__(self, cfg: Config):
        super().__init__(
            cfg=cfg,
            name="osint-agent",
            model="llama3.2:3b",
            system_prompt=(
                "You are an OSINT agent in the Trokk intelligence operating system. "
                "Your role is to investigate technical infrastructure: WHOIS records, "
                "DNS configurations, SSL certificates, domain history, and hosting information. "
                "Report with: Domain Analysis, DNS Records, SSL/TLS Status, Infrastructure Details, Security Findings."
            ),
        )

    def _research(self, state: AgentState) -> AgentState:
        state = super()._research(state)
        if not state.error and state.research_output:
            state.research_output = f"## OSINT Analysis\n\n{state.research_output}"
        return state
