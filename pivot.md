# Trokk Pivot Plan
## From Multi-Agent Simulation → AI Intelligence Operating System

**Status:** Approved
**Version:** 2.0
**Goal:** Reposition Trokk for real-world intelligence workflows while preserving the existing backend architecture.

---

# Executive Summary

Trokk is **not** being rewritten.

The current backend architecture is already generic, scalable, and well-designed.

The pivot changes the **product layer**, **user workflows**, and **branding**, while preserving the majority of the backend implementation.

Instead of simulating autonomous AI agents interacting in an isolated network, Trokk will orchestrate specialized AI intelligence agents that collaboratively investigate real-world questions.

---

# Why This Pivot

The current implementation solves:

- Agent orchestration
- Message passing
- Scheduling
- Coordination
- Distributed communication

These capabilities naturally extend to real-world AI research workflows.

Instead of:

> studying emergent behavior

Trokk becomes:

> orchestrating intelligence.

---

# What Stays

The following components remain unchanged.

## Backend

- Go REST API
- PostgreSQL
- Redis
- Docker setup
- Authentication
- Scheduler APIs
- Agent CRUD
- Control APIs
- Cursor pagination
- Goose migrations
- Request lifecycle
- Redis cache
- Tick system

No architectural redesign is required.

---

## Infrastructure

Keep

Docker

Redis

Postgres

Go

Python

Mesh API

---

## Core Concepts

These concepts remain.

Agent

Scheduler

Timeline

Control Plane

Investigation State

Task Queue

Agent Runtime

---

# What Changes

The product semantics change.

---

## Old

Agent

↓

Post Message

↓

Reply

↓

Endorse

↓

Propagate

---

## New

Agent

↓

Publish Finding

↓

Challenge Finding

↓

Verify Evidence

↓

Reach Consensus

---

# Product Positioning

Old

Multi-Agent Research Simulation Platform

New

AI Intelligence Operating System

---

# New Tagline

One Question.

Many Expert Agents.

Evidence.

Reasoning.

Consensus.

---

# New User Flow

User asks

"Research Cursor AI"

↓

Create Investigation

↓

Spawn Specialist Agents

↓

Collect Evidence

↓

Cross Verification

↓

Consensus

↓

Final Report

---

# Agent System

Replace social personas with specialist intelligence agents.

## Research Agent

Responsibilities

- Web Search
- Documentation
- Official Sources

Model

Gemini

---

## News Agent

Responsibilities

- News
- Press Releases
- RSS

---

## Reddit Agent

Responsibilities

- Community Sentiment
- Discussions
- FAQs

---

## GitHub Agent

Responsibilities

- Repository Analysis
- Commit Activity
- Contributors
- Issues

---

## Financial Agent

Responsibilities

- Company filings
- Revenue
- Valuation
- Funding

---

## Crypto Agent

Responsibilities

- CoinGecko
- DefiLlama
- DexScreener
- Tokenomics

---

## OSINT Agent

Responsibilities

- WHOIS
- DNS
- SSL
- Domains

---

## Fact Checker

Responsibilities

Verify previous findings.

Detect hallucinations.

Reject unsupported claims.

---

## Consensus Agent

Responsibilities

Read every finding.

Generate

- Executive Summary
- Confidence
- Sources
- Open Questions
- Recommendations

---

# Investigation Lifecycle

1.

User creates investigation.

2.

Scheduler generates tasks.

3.

Agents execute independently.

4.

Agents publish findings.

5.

Other agents verify.

6.

Consensus agent waits.

7.

Final report generated.

---

# API Changes

Backend routes remain unchanged.

Frontend terminology changes.

Current API

/messages

Frontend Label

Findings

---

Current

/respond

Frontend

Evidence

---

Current

/endorse

Frontend

Verify

---

Current

/propagate

Frontend

Escalate

---

No database migration required.

---

# Database

Keep schema exactly as-is.

No renaming of tables.

Mappings happen in the frontend.

messages

→ Findings

endorsements

→ Verifications

propagations

→ Escalations

---

# Python Runtime

Highest priority.

Implement

LangGraph Runtime

Mesh Integration

Scheduler

Task Queue

Specialist Agents

Consensus Agent

Checkpointing

---

# Mesh Integration

Every LLM request must pass through Mesh.

Different agents should use different models.

Example

Research

Gemini

Reasoning

Claude

Writing

GPT

Verification

DeepSeek

---

# Frontend Redesign

Replace social feed with investigation workspace.

Pages

Landing

Dashboard

Investigations

Reports

Settings

---

Dashboard

Question Input

↓

Live Investigation Timeline

↓

Agent Activity

↓

Evidence

↓

Final Report

---

# Investigation Templates

Company Research

Startup Due Diligence

Crypto Analysis

Stock Research

Competitor Analysis

Security Investigation

Academic Research

Government Policy

---

# Reports

Every investigation outputs

Executive Summary

Timeline

Key Findings

Evidence

Sources

Confidence Score

Contradictions

Recommendations

---

# UI Direction

Minimal

Professional

Apple

Linear

Cursor

Perplexity

Dark Mode

No cyberpunk aesthetics.

---

# Long-Term Vision

Trokk becomes an operating system for knowledge work.

Future capabilities include

Browser Automation

Email Agents

Slack Agents

GitHub Agents

Google Drive Agents

Calendar Agents

Notion Agents

Workflow Automation

Autonomous Research

---

# Immediate Development Priorities

Priority 1

Python Runtime

Priority 2

Mesh Integration

Priority 3

Investigation Dashboard

Priority 4

Specialist Agents

Priority 5

Report Generation

Priority 6

Landing Page

---

# Explicitly Out of Scope

Do not rebuild the Go backend.

Do not redesign the database.

Do not replace PostgreSQL.

Do not replace Redis.

Do not rewrite REST endpoints.

Do not redesign authentication.

Do not introduce microservices.

Do not build browser automation.

Do not build trading systems.

Do not build portfolio management.

Focus only on transforming Trokk into an AI Intelligence Operating System using the existing architecture.