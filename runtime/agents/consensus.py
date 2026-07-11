import json
import uuid
from dataclasses import dataclass, field

from config import Config
from mesh import MeshClient, MeshMessage


@dataclass
class ConsensusReport:
    investigation_id: uuid.UUID
    question: str
    executive_summary: str
    key_findings: list[dict] = field(default_factory=list)
    contradictions: list[dict] = field(default_factory=list)
    confidence_score: float = 0.0
    open_questions: list[str] = field(default_factory=list)
    recommendations: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "investigation_id": str(self.investigation_id),
            "question": self.question,
            "executive_summary": self.executive_summary,
            "key_findings": self.key_findings,
            "contradictions": self.contradictions,
            "confidence_score": self.confidence_score,
            "open_questions": self.open_questions,
            "recommendations": self.recommendations,
        }


class ConsensusAgent:
    def __init__(self, cfg: Config):
        self.cfg = cfg
        self.mesh = MeshClient(cfg.mesh_url, cfg.mesh_api_key)

    def generate_report(
        self, investigation_id: uuid.UUID, question: str, findings: list[dict]
    ) -> ConsensusReport:
        findings_text = "\n\n---\n\n".join(
            f"Agent: {f.get('agent_username', 'unknown')} ({f.get('agent_display_name', '')})\n"
            f"Content: {f.get('content', '')}\n"
            f"Endorsements: {f.get('endorsement_count', 0)}"
            for f in findings
        )

        prompt = (
            "You are the consensus agent in the Trokk intelligence operating system. "
            "Your role is to synthesize all findings from specialist agents into a single "
            "comprehensive report. Be objective, highlight contradictions, and assign a "
            "confidence score (0.0 to 1.0) based on source quality and cross-verification.\n\n"
            f"## Investigation Question\n{question}\n\n"
            f"## Agent Findings\n{findings_text}\n\n"
            "Produce a JSON report with these fields:\n"
            "- executive_summary: string\n"
            "- key_findings: array of {finding, agent, verified, confidence}\n"
            "- contradictions: array of {claim_a, claim_b, resolution}\n"
            "- confidence_score: float 0-1\n"
            "- open_questions: array of strings\n"
            "- recommendations: array of strings\n\n"
            "Respond with ONLY valid JSON. No markdown, no code fences."
        )

        messages = [
            MeshMessage(role="system", content="You are a consensus synthesis engine. Output valid JSON only."),
            MeshMessage(role="user", content=prompt),
        ]

        resp = self.mesh.chat(
            model="anthropic/claude-sonnet-4-20250514",
            messages=messages,
            max_tokens=4096,
            temperature=0.3,
        )

        try:
            data = json.loads(resp.content.strip())
        except json.JSONDecodeError:
            data = json.loads(extract_json(resp.content))

        return ConsensusReport(
            investigation_id=investigation_id,
            question=question,
            executive_summary=data.get("executive_summary", ""),
            key_findings=data.get("key_findings", []),
            contradictions=data.get("contradictions", []),
            confidence_score=data.get("confidence_score", 0.5),
            open_questions=data.get("open_questions", []),
            recommendations=data.get("recommendations", []),
        )

    def close(self):
        self.mesh.close()


def extract_json(text: str) -> str:
    """Extract JSON from text that may contain markdown code fences."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()
