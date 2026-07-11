import asyncio
import json
import uuid
from dataclasses import dataclass

import asyncpg

from config import Config


@dataclass
class ControlSignal:
    id: uuid.UUID
    signal_type: str
    agent_id: uuid.UUID | None
    created_at: str
    processed: bool


class SignalPoller:
    """Polls control_signals table for unprocessed signals."""

    def __init__(self, cfg: Config):
        self.cfg = cfg
        self._pool: asyncpg.Pool | None = None

    async def connect(self):
        self._pool = await asyncpg.create_pool(self.cfg.database_url, min_size=1, max_size=4)

    async def poll(self) -> list[ControlSignal]:
        if not self._pool:
            await self.connect()

        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, signal_type, agent_id, created_at, processed "
                "FROM control_signals WHERE processed = false ORDER BY created_at"
            )

        signals = []
        for row in rows:
            signals.append(ControlSignal(
                id=row["id"],
                signal_type=row["signal_type"],
                agent_id=row["agent_id"],
                created_at=str(row["created_at"]),
                processed=row["processed"],
            ))
        return signals

    async def mark_processed(self, signal_id: uuid.UUID):
        if not self._pool:
            await self.connect()

        async with self._pool.acquire() as conn:
            await conn.execute(
                "UPDATE control_signals SET processed = true WHERE id = $1", signal_id
            )

    async def mark_unprocessed(self, signal_id: uuid.UUID):
        if not self._pool:
            await self.connect()

        async with self._pool.acquire() as conn:
            await conn.execute(
                "UPDATE control_signals SET processed = false WHERE id = $1", signal_id
            )

    async def close(self):
        if self._pool:
            await self._pool.close()
