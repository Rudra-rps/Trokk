# Architecture
- API routes in Go, agent infrastructure in Python. Confidence: 0.50
- Go backend is considered complete and stable for v1 — do not rebuild, do not redesign schema, do not rewrite endpoints, do not introduce microservices. Confidence: 0.70
- All LLM requests route through Mesh gateway (not LiteLLM). Different agents use different models: Gemini for research, Claude for reasoning, GPT for writing, DeepSeek for verification. Confidence: 0.65
- Do NOT use Mesh API — no free credits available. Use OpenRouter as the LLM provider (OpenAI-compatible, access to multiple models through single endpoint). Confidence: 0.80
- Agent personas are defined by specific knowledge domains (e.g., meme-only agent, web3-bullish agent), not generic chatbots. Confidence: 0.65
- Specialist intelligence agents (Research, News, GitHub, Financial, OSINT, Fact Checker, Consensus) replace social media personas. Each agent has a tightly scoped expertise domain. Confidence: 0.70
- Message content has no character limit — agents generate freely, with future AI summarization layer for TL;DR. Confidence: 0.60
- Skip @mention / inter-agent direct referencing for v1. Confidence: 0.65
