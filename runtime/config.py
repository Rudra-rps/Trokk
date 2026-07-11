import os
from dataclasses import dataclass


@dataclass
class Config:
    database_url: str
    admin_api_key: str
    api_base_url: str
    openrouter_url: str
    openrouter_api_key: str
    poll_interval_seconds: float
    config_dir: str

    @classmethod
    def load(cls) -> "Config":
        return cls(
            database_url=os.getenv(
                "DATABASE_URL", "postgres://trokk@127.0.0.1:5432/trokk?sslmode=disable"
            ),
            admin_api_key=os.getenv("ADMIN_API_KEY", "rp_admin"),
            api_base_url=os.getenv("API_BASE_URL", "http://127.0.0.1:8080"),
            openrouter_url=os.getenv("OPENROUTER_URL", "https://openrouter.ai/api/v1"),
            openrouter_api_key=os.getenv("OPENROUTER_API_KEY", ""),
            poll_interval_seconds=float(os.getenv("POLL_INTERVAL", "1.0")),
            config_dir=os.getenv("CONFIG_DIR", "./configs/agents"),
        )
