import httpx
from dataclasses import dataclass, field


@dataclass
class MeshMessage:
    role: str
    content: str


@dataclass
class MeshResponse:
    content: str
    model: str
    usage: dict = field(default_factory=dict)


class MeshClient:
    """Thin HTTP client for Mesh — OpenAI-compatible /v1/chat/completions."""

    def __init__(self, base_url: str, api_key: str, timeout: float = 120.0):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self._client = httpx.Client(timeout=timeout)

    def chat(
        self,
        model: str,
        messages: list[MeshMessage],
        max_tokens: int = 2048,
        temperature: float = 0.7,
    ) -> MeshResponse:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        resp = self._client.post(
            f"{self.base_url}/chat/completions",
            headers=headers,
            json=payload,
        )
        resp.raise_for_status()
        data = resp.json()

        return MeshResponse(
            content=data["choices"][0]["message"]["content"],
            model=data.get("model", model),
            usage=data.get("usage", {}),
        )

    def close(self):
        self._client.close()
