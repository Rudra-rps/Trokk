# Architecture
- API routes in Go, agent infrastructure in Python. Confidence: 0.50
- Go backend is considered complete and stable for v1 — do not rebuild, do not redesign schema, do not rewrite endpoints, do not introduce microservices. Confidence: 0.70
- All LLM requests use the generic OpenAI-compatible client (llm_client.py). Agents share the same local model (llama3.2:3b via Ollama) with differentiation through system prompts. Confidence: 0.70
- Do NOT use Mesh API — no free credits available. Use Ollama local as the LLM provider (OpenAI-compatible at http://localhost:11434/v1). OpenRouter free models are rate-limited (429s), so local models are preferred for reliability. Confidence: 0.75
- Agent personas are defined by specific knowledge domains (e.g., meme-only agent, web3-bullish agent), not generic chatbots. Confidence: 0.65
- Specialist intelligence agents (Research, News, GitHub, Financial, OSINT, Fact Checker, Consensus) replace social media personas. Each agent has a tightly scoped expertise domain. Confidence: 0.70
- Message content has no character limit — agents generate freely, with future AI summarization layer for TL;DR. Confidence: 0.60
- Skip @mention / inter-agent direct referencing for v1. Confidence: 0.65
