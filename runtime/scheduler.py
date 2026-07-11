import asyncio
import uuid

import asyncpg

from config import Config


class Scheduler:
    """Polls investigation_tasks for pending tasks and dispatches to agents."""

    def __init__(self, cfg: Config):
        self.cfg = cfg
        self._pool: asyncpg.Pool | None = None

    async def connect(self):
        self._pool = await asyncpg.create_pool(self.cfg.database_url, min_size=1, max_size=8)

    async def get_pending_task(
        self, agent_id: uuid.UUID, task_type: str | None = None
    ) -> dict | None:
        if not self._pool:
            await self.connect()

        async with self._pool.acquire() as conn:
            query = """
                UPDATE investigation_tasks
                SET status = 'running'
                WHERE id = (
                    SELECT id FROM investigation_tasks
                    WHERE agent_id = $1 AND status = 'pending'
                    AND ($2::text IS NULL OR task_type = $2)
                    ORDER BY created_at
                    LIMIT 1
                    FOR UPDATE SKIP LOCKED
                )
                RETURNING id, investigation_id, agent_id, task_type, task_prompt
            """
            row = await conn.fetchrow(query, agent_id, task_type)

        if row:
            return {
                "id": row["id"],
                "investigation_id": row["investigation_id"],
                "agent_id": row["agent_id"],
                "task_type": row["task_type"],
                "task_prompt": row["task_prompt"],
            }
        return None

    async def complete_task(self, task_id: uuid.UUID, result: dict):
        if not self._pool:
            await self.connect()

        import json
        async with self._pool.acquire() as conn:
            await conn.execute(
                "UPDATE investigation_tasks SET status = 'complete', result = $2, completed_at = now() WHERE id = $1",
                task_id,
                json.dumps(result),
            )

    async def fail_task(self, task_id: uuid.UUID, error: str):
        if not self._pool:
            await self.connect()

        import json
        async with self._pool.acquire() as conn:
            await conn.execute(
                "UPDATE investigation_tasks SET status = 'failed', result = $2, completed_at = now() WHERE id = $1",
                task_id,
                json.dumps({"error": error}),
            )

    async def get_active_investigations(self) -> list[uuid.UUID]:
        if not self._pool:
            await self.connect()

        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id FROM investigations WHERE status IN ('in_progress', 'consensus') ORDER BY created_at"
            )
        return [r["id"] for r in rows]

    async def get_investigation_findings(self, investigation_id: uuid.UUID) -> list[dict]:
        if not self._pool:
            await self.connect()

        async with self._pool.acquire() as conn:
            rows = await conn.fetch(
                """SELECT m.id, m.content, m.created_at, a.username, a.display_name,
                   COALESCE(e.cnt, 0) as endorsements
                   FROM messages m
                   JOIN agents a ON a.id = m.agent_id
                   LEFT JOIN (
                       SELECT message_id, COUNT(*) as cnt FROM endorsements GROUP BY message_id
                   ) e ON e.message_id = m.id
                   WHERE m.parent_msg_id = $1
                   ORDER BY m.created_at ASC""",
                investigation_id,
            )

        findings = []
        for row in rows:
            findings.append({
                "id": str(row["id"]),
                "content": row["content"],
                "created_at": str(row["created_at"]),
                "agent_username": row["username"],
                "agent_display_name": row["display_name"],
                "endorsement_count": row["endorsements"],
            })
        return findings

    async def get_investigation_question(self, investigation_id: uuid.UUID) -> str:
        if not self._pool:
            await self.connect()

        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT question FROM investigations WHERE id = $1", investigation_id
            )
        return row["question"] if row else ""

    async def set_investigation_status(self, investigation_id: uuid.UUID, status: str):
        if not self._pool:
            await self.connect()

        async with self._pool.acquire() as conn:
            await conn.execute(
                "UPDATE investigations SET status = $2 WHERE id = $1",
                investigation_id, status,
            )

    async def set_investigation_report(self, investigation_id: uuid.UUID, report: dict):
        if not self._pool:
            await self.connect()

        import json
        async with self._pool.acquire() as conn:
            await conn.execute(
                "UPDATE investigations SET report = $2 WHERE id = $1",
                investigation_id, json.dumps(report),
            )

    async def count_pending_tasks(self, investigation_id: uuid.UUID) -> int:
        if not self._pool:
            await self.connect()

        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT COUNT(*) FROM investigation_tasks WHERE investigation_id = $1 AND status IN ('pending', 'running')",
                investigation_id,
            )
        return row["count"] if row else 0

    async def close(self):
        if self._pool:
            await self._pool.close()
