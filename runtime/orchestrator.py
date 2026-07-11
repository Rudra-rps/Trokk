"""
Trokk Orchestrator — Main entry point for the Python agent runtime.

Manages the investigation lifecycle:
1. Poll control_signals for start_investigation signals
2. Dispatch tasks to specialist agents via the scheduler
3. Monitor investigation progress
4. Trigger consensus when all tasks complete
5. Publish final report

Usage:
    python orchestrator.py
"""

import asyncio
import json
import logging
import uuid
from pathlib import Path

import yaml

from config import Config
from signals import SignalPoller
from scheduler import Scheduler
from agents.research import ResearchAgent
from agents.fact_checker import FactCheckerAgent
from agents.consensus import ConsensusAgent
from agents.specialists import (
    NewsAgent,
    RedditAgent,
    GitHubAgent,
    FinancialAgent,
    CryptoAgent,
    OsintAgent,
)

logger = logging.getLogger("trokk.orchestrator")


AGENT_REGISTRY = {
    "research": ResearchAgent,
    "news": NewsAgent,
    "reddit": RedditAgent,
    "github": GitHubAgent,
    "financial": FinancialAgent,
    "crypto": CryptoAgent,
    "osint": OsintAgent,
    "fact_check": FactCheckerAgent,
}


class Orchestrator:
    def __init__(self, cfg: Config):
        self.cfg = cfg
        self.signals = SignalPoller(cfg)
        self.scheduler = Scheduler(cfg)
        self.consensus = ConsensusAgent(cfg)
        self.agents: dict[str, object] = {}

    async def start(self):
        logger.info("connecting to database")
        await self.signals.connect()
        await self.scheduler.connect()
        logger.info("orchestrator ready — polling for signals")

        while True:
            try:
                await self.tick()
            except Exception as exc:
                logger.exception("orchestrator tick failed", exc_info=exc)
            await asyncio.sleep(self.cfg.poll_interval_seconds)

    async def tick(self):
        signals = await self.signals.poll()
        for signal in signals:
            logger.info("processing signal", extra={"signal_type": signal.signal_type, "signal_id": str(signal.id)})

            if signal.signal_type == "force_tick" and signal.agent_id:
                await self._handle_agent_tick(signal.agent_id)
            elif signal.signal_type == "start_investigation":
                await self._handle_investigation_start()
            elif signal.signal_type == "trigger_consensus":
                await self._handle_consensus_check()

            await self.signals.mark_processed(signal.id)

    async def _handle_agent_tick(self, agent_id: uuid.UUID):
        for task_type, agent_cls in AGENT_REGISTRY.items():
            task = await self.scheduler.get_pending_task(agent_id, task_type)
            if task:
                agent_key = f"{task_type}-{agent_id}"
                if agent_key not in self.agents:
                    self.agents[agent_key] = agent_cls(self.cfg)

                agent = self.agents[agent_key]
                try:
                    result = agent.run(
                        task_id=task["id"],
                        investigation_id=task["investigation_id"],
                        task_prompt=task["task_prompt"],
                    )
                    if result.error:
                        await self.scheduler.fail_task(task["id"], result.error)
                        logger.error("agent task failed", extra={"task_id": str(task["id"]), "error": result.error})
                    else:
                        await self.scheduler.complete_task(task["id"], {"finding_id": str(result.finding_id) if result.finding_id else None})
                        logger.info("agent task complete", extra={"task_id": str(task["id"]), "finding_id": str(result.finding_id)})
                except Exception as exc:
                    await self.scheduler.fail_task(task["id"], str(exc))
                    logger.exception("agent task exception", exc_info=exc)

    async def _handle_investigation_start(self):
        logger.info("checking active investigations")
        inv_ids = await self.scheduler.get_active_investigations()
        for inv_id in inv_ids:
            pending = await self.scheduler.count_pending_tasks(inv_id)
            logger.info("investigation progress", extra={"investigation_id": str(inv_id), "pending_tasks": pending})

    async def _handle_consensus_check(self):
        inv_ids = await self.scheduler.get_active_investigations()
        for inv_id in inv_ids:
            pending = await self.scheduler.count_pending_tasks(inv_id)
            if pending == 0:
                await self._run_consensus(inv_id)

    async def _run_consensus(self, investigation_id: uuid.UUID):
        logger.info("running consensus", extra={"investigation_id": str(investigation_id)})

        question = await self.scheduler.get_investigation_question(investigation_id)
        findings = await self.scheduler.get_investigation_findings(investigation_id)

        if not findings:
            logger.warning("no findings for consensus", extra={"investigation_id": str(investigation_id)})
            return

        try:
            report = self.consensus.generate_report(investigation_id, question, findings)
            await self.scheduler.set_investigation_report(investigation_id, report.to_dict())
            await self.scheduler.set_investigation_status(investigation_id, "complete")
            logger.info("consensus complete", extra={"investigation_id": str(investigation_id), "confidence": report.confidence_score})
        except Exception as exc:
            logger.exception("consensus failed", exc_info=exc)

    async def close(self):
        for agent in self.agents.values():
            if hasattr(agent, "close"):
                agent.close()
        self.consensus.close()
        await self.scheduler.close()
        await self.signals.close()


async def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    cfg = Config.load()
    orch = Orchestrator(cfg)
    try:
        await orch.start()
    except KeyboardInterrupt:
        logger.info("shutting down")
    finally:
        await orch.close()


if __name__ == "__main__":
    asyncio.run(main())
