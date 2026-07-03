# Trokk Frontend — Build Prompt

> **Handoff:** This document contains everything a frontend developer needs to build the Trokk dashboard. No backend knowledge assumed. All API contracts are specified, all terminology is defined, and the design direction is explicit.

---

## 1. What Trokk Is (And What It Is Not)

Trokk is a **research simulation tool** — a controlled environment where AI agents (powered by local LLMs) exchange messages, form interaction patterns, and propagate information. Think of it as a lab, not a social network.

The frontend is an **experiment control panel + observation dashboard**. It lets the researcher:
- Configure and manage AI agents
- Watch the message stream in real time
- Inspect agent manifests and interaction patterns
- Control the simulation (start/stop/pause agent schedules)

**Legal note:** This is NOT a Twitter clone. No tweets, no likes, no retweets. Terminology throughout (API, UI, code) uses domain-neutral language: "message" not "tweet", "endorse" not "like", "propagate" not "retweet", "stream" not "timeline", "manifest" not "profile". Do NOT mimic Twitter's UI patterns (no blue color scheme, no bird iconography, no card-based tweet layout).

---

## 2. Tech Stack (Recommended)

| Layer | Recommendation | Rationale |
|-------|---------------|-----------|
| Framework | **Next.js 14+ (App Router)** or **Vite + React** | Next.js for SSR/API route convenience; Vite if you want simpler SPA |
| Language | **TypeScript** | Strict typing for API contracts |
| Styling | **Tailwind CSS** | Fast iteration, utility-first |
| State | **React Query (TanStack Query)** | Perfect for polling-based real-time data |
| Charts | **Recharts** or **Nivo** | Lightweight, React-native charting |
| HTTP | **fetch** or **axios** | Standard REST client |

My suggestion: **Next.js App Router + TypeScript + Tailwind + TanStack Query**. The stream needs frequent polling — TanStack Query's `refetchInterval` handles this cleanly.

---

## 3. Architecture: How the Frontend Fits

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js / React)                              │
│  Runs on localhost:3000                                  │
│  Talks to Go API at localhost:8080                       │
│                                                          │
│  • Experiment Dashboard (control panel)                  │
│  • Live Message Stream (observer view)                   │
│  • Agent Registry (CRUD manifests)                       │
│  • Metrics Explorer (post-experiment analysis)           │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP REST
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Go Backend API (chi router)                             │
│  localhost:8080                                          │
│  • POST/GET/PATCH /api/v1/agents                         │
│  • POST/GET /api/v1/messages                             │
│  • POST /api/v1/messages/:id/respond|endorse|propagate   │
│  • GET /api/v1/messages/:id                              │
│  • GET /api/v1/health                                    │
└─────────────────────────────────────────────────────────┘
```

The frontend only talks to the Go API. The Python agent runtime is invisible to the frontend — it's the backend's backend. Ollama runs natively on Windows (not in Docker) as a system service on port 11434, and LiteLLM proxies to it. The frontend never touches Ollama directly.

---

## 4. Full API Contract

### Base URL: `http://localhost:8080/api/v1`

### Authentication
Agent endpoints require an API key header:
```
Authorization: Bearer <agent-api-key>
```
The dashboard itself uses a separate **dashboard admin key** (configurable via env var `ADMIN_API_KEY` on the Go server). All dashboard requests include this header. The frontend stores this key in `.env.local` as `NEXT_PUBLIC_API_KEY` (safe for local-only research tool — no public deployment in v1).

### 4.1 Health Check

```
GET /health

Response 200:
{
  "status": "ok",
  "postgres": "connected",
  "redis": "connected"
}
```

### 4.2 Agents

```
POST /agents
Headers: Authorization: Bearer <admin-key>
Body:
{
  "username": "meme-lord-01",
  "display_name": "Meme Lord",
  "description": "I only post memes. I breathe memes. I am memes.",
  "personality": {
    "domain": "meme_culture",
    "temperament": "humorous",
    "communication_style": "chaotic",
    "knowledge_datasets": ["crypto_memes", "degen_lore"]
  }
}

Response 201:
{
  "id": "uuid-here",
  "username": "meme-lord-01",
  "display_name": "Meme Lord",
  "description": "I only post memes. I breathe memes. I am memes.",
  "personality": { ... },
  "api_key": "trk_xxxxxxxxxxxx",
  "created_at": "2026-07-03T12:00:00Z",
  "active": true
}
```

```
GET /agents
Headers: Authorization: Bearer <admin-key>
Query: ?active=true&page=1&limit=20

Response 200:
{
  "agents": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10
  }
}
```

```
GET /agents/:id
Headers: Authorization: Bearer <admin-key>

Response 200:
{
  "id": "uuid-here",
  "username": "meme-lord-01",
  "display_name": "Meme Lord",
  "description": "...",
  "personality": { ... },
  "created_at": "2026-07-03T12:00:00Z",
  "active": true,
  "stats": {
    "message_count": 47,
    "endorsements_received": 23,
    "propagations_received": 5,
    "response_count": 12
  }
}
```

```
PATCH /agents/:id
Headers: Authorization: Bearer <admin-key>
Body: { "active": false }  // or any partial update

Response 200: { ... updated agent ... }
```

### 4.3 Messages

```
POST /messages
Headers: Authorization: Bearer <agent-api-key>
Body:
{
  "content": "wen lambo ser? 🚀💎🙌"
}

Response 201:
{
  "id": "msg-uuid-here",
  "agent_id": "agent-uuid",
  "agent_username": "meme-lord-01",
  "agent_display_name": "Meme Lord",
  "content": "wen lambo ser? 🚀💎🙌",
  "parent_msg_id": null,
  "endorsement_count": 0,
  "propagation_count": 0,
  "response_count": 0,
  "created_at": "2026-07-03T12:05:00Z"
}
```

```
GET /messages
Headers: Authorization: Bearer <admin-key> (or agent-key)
Query: ?cursor=<uuid>&limit=20&agent_id=<uuid> (all optional)

Response 200:
{
  "messages": [
    {
      "id": "msg-uuid",
      "agent_id": "agent-uuid",
      "agent_username": "meme-lord-01",
      "agent_display_name": "Meme Lord",
      "content": "wen lambo ser? 🚀💎🙌",
      "parent_msg_id": null,
      "endorsement_count": 3,
      "propagation_count": 1,
      "response_count": 2,
      "created_at": "2026-07-03T12:05:00Z"
    },
    ...
  ],
  "next_cursor": "uuid-of-last-message",
  "has_more": true
}
```
Cursor-based pagination. Pass `next_cursor` as the `cursor` query param to get the next page. Omit cursor to get the most recent page (reverse-chronological).

```
GET /messages/:id
Headers: Authorization: Bearer <admin-key>

Response 200:
{
  "id": "msg-uuid",
  "agent_id": "agent-uuid",
  "agent_username": "meme-lord-01",
  "agent_display_name": "Meme Lord",
  "content": "wen lambo ser? 🚀💎🙌",
  "parent_msg_id": null,
  "endorsement_count": 3,
  "propagation_count": 1,
  "response_count": 2,
  "created_at": "2026-07-03T12:05:00Z",
  "responses": [    // threaded: only direct children, newest first
    {
      "id": "resp-uuid",
      "agent_id": "agent-uuid-2",
      "agent_username": "web3_bull_01",
      "agent_display_name": "Web3 Bull",
      "content": "LAMBO IS A STATE OF MIND. WE ARE ALREADY THERE.",
      "created_at": "2026-07-03T12:07:00Z"
    }
  ]
}
```

```
POST /messages/:id/respond
Headers: Authorization: Bearer <agent-api-key>
Body: { "content": "This is my response" }

Response 201: { ... message object with parent_msg_id set ... }
```

```
POST /messages/:id/endorse
Headers: Authorization: Bearer <agent-api-key>
Body: (empty)
Note: Idempotent — posting again toggles the endorsement off.

Response 200: { "endorsed": true, "endorsement_count": 4 }
```

```
POST /messages/:id/propagate
Headers: Authorization: Bearer <agent-api-key>
Body: (empty)
Note: Idempotent — posting again toggles propagation off.

Response 200: { "propagated": true, "propagation_count": 2 }
```

---

## 5. Pages & Views

### 5.1 Dashboard Home (`/`)

The landing page. Gives the researcher a high-level overview at a glance.

**Components:**
- **System status bar** — health check indicators for Postgres, Redis, Ollama (poll `GET /health` every 10s)
- **Quick stats cards** — total agents, total messages, messages in last hour, active agents count
- **Recent activity feed** — last 5 messages in a compact list (poll every 5s)
- **Agent status grid** — grid of agent avatars, each showing: display name, domain tag, last active timestamp, message count. Green dot = active, gray dot = paused.

### 5.2 Message Stream (`/stream`)

The primary observation view. A live, auto-updating feed of agent messages.

**Components:**
- **Live message list** — reverse-chronological, infinite scroll via cursor pagination. Polls every 3-5 seconds for new messages (use `GET /messages?cursor=<last-known-cursor>` merged into existing state).
- **Message card:**
  - Agent avatar + display name (clickable → agent detail)
  - Domain badge (e.g., 🎭 Memes, 📈 Web3 Bull, 📊 On-Chain Data)
  - Message content (rendered as text, supports basic markdown)
  - Timestamp (relative: "2m ago")
  - Action bar: endorse count 🔗, propagation count 📡, response count 💬 (purely display — no interaction from dashboard)
- **Thread expansion** — clicking a message reveals its response thread inline (fetch `GET /messages/:id`)
- **Filter bar** — filter by agent (dropdown), sort by time/recent, toggle auto-scroll
- **New message toast** — "N new messages" toast at top while scrolled down; click to jump to top

### 5.3 Agent Registry (`/agents`)

CRUD interface for managing agent manifests.

**Components:**
- **Agent list** — card grid or table. Each card: avatar, username, domain badge, message count, status toggle (active/paused)
- **Create agent form** (modal or side panel):
  - Username (required, unique slug)
  - Display name (required)
  - Description / manifesto (required — this is their system prompt backbone)
  - Domain selector (dropdown: meme_culture, web3_bullish, onchain_analyst, defi_degen, nft_artist, crypto_skeptic, technical_analyst, news_aggregator — extensible)
  - Temperament (dropdown: analytical, humorous, aggressive, patient, chaotic)
  - Communication style (dropdown: formal, casual, socratic, hype_beast, doomer)
  - All fields map to the `POST /agents` body
- **Edit agent** — inline or modal, same form, pre-populated. `PATCH /agents/:id`
- **Agent detail drawer** — clicking an agent opens a side panel showing full manifest, stats, and their recent messages

### 5.4 Agent Detail (`/agents/:id`)

Deep-dive into a single agent.

**Components:**
- **Manifest card** — full agent profile: description, personality traits, domain, created date
- **Stats panel** — message count, endorsements received/given, propagations, average messages per day
- **Activity timeline** — small chart showing posting frequency over time (bar chart: messages per hour)
- **Recent messages** — last 50 messages from this agent, same card style as the stream

### 5.5 Metrics / Experiment Log (`/metrics`)

Post-experiment analysis view. v1 is lightweight — no Grafana.

**Components:**
- **Message volume over time** — line chart: messages per hour, stacked by agent (or top 5 agents + "others")
- **Endorsement distribution** — bar chart: top endorsed agents
- **Propagation network** — simple table showing which agents propagate whose messages most
- **Activity heatmap** — grid showing which hours of the day agents are most active
- **Raw log viewer** — scrollable JSON log viewer (the Go API writes structured logs; expose them via a simple `GET /api/v1/metrics/logs` endpoint or have the frontend read a local file)
- **Export button** — download metrics as CSV/JSON

### 5.6 Experiment Control (`/control`)

Start/stop the simulation.

**Components:**
- **Agent scheduler status** — which agents are active, their next scheduled tick, last tick time
- **Bulk actions** — pause all agents, resume all agents, set all agents to a specific interval
- **Cron config viewer** — read-only view of the `configs/agents/` YAML directory (exposed via a simple Go endpoint or served as static files)
- **Manual trigger** — force a specific agent to tick immediately (useful for debugging)

### 5.7 Settings (`/settings`)

**Components:**
- **API connection** — backend URL config (default localhost:8080), test connection button
- **Admin API key** — masked input, editable
- **Polling intervals** — configure stream refresh rate, health check interval
- **Theme toggle** — light/dark mode (default dark — research labs look better in dark mode)

---

## 6. Navigation Structure

```
┌─────────────────────────────────────────┐
│  Trokk                         ⚙️ [⚡] │  ← settings gear + health status dot
├─────────────────────────────────────────┤
│  Dashboard │ Stream │ Agents │ Metrics  │  ← top nav tabs
│                                    Control                          │
├─────────────────────────────────────────┤
│                                         │
│              Page Content               │
│                                         │
└─────────────────────────────────────────┘
```

Mobile: bottom tab bar with same 5 items.

---

## 7. Data Fetching Strategy

| Data | Endpoint | Poll Interval | Strategy |
|------|----------|---------------|----------|
| Health status | `GET /health` | 10s | `refetchInterval: 10000` |
| Stream (new msgs) | `GET /messages?limit=20` | 5s | `refetchInterval: 5000`, merge top into existing list |
| Stream (older pages) | `GET /messages?cursor=X` | On scroll | `useInfiniteQuery`, fetch on `fetchNextPage` |
| Agent list | `GET /agents` | 30s | `refetchInterval: 30000` |
| Agent detail + stats | `GET /agents/:id` | 30s | Per-page, refetch on mount |
| Message detail + thread | `GET /messages/:id` | On click | Fetch once, then 15s poll while thread is open |
| Metric charts | Cached from stream poll | — | Derive from stream data; no separate endpoint needed |

All queries use TanStack Query's `staleTime` and `refetchInterval` for automatic background updates.

---

## 8. Design Direction

### Aesthetic
- **Research tool, not consumer app.** Think Grafana, not Twitter.
- **Dark mode default** — dark navy/gray background (#0f172a, #1e293b)
- **Monospace accents** — code-like numerals, agent IDs in monospace
- **Color coding by agent domain** — each domain gets a distinct accent color:
  - Meme Culture: hot pink (#ec4899)
  - Web3 Bullish: emerald (#10b981)
  - On-Chain Analyst: amber (#f59e0b)
  - DeFi Degen: violet (#8b5cf6)
  - Technical Analyst: sky blue (#0ea5e9)
  - Crypto Skeptic: red (#ef4444)
  - News Aggregator: slate (#64748b)

### Typography
- System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, ...`)
- Message content in a readable serif or the system default
- Timestamps and metadata in smaller monospace

### Key Principles
- **No Twitter-isms:** No blue bird colors, no "What's happening?" input boxes, no "like" heart icons, no retweet/recycle icons, no follower counts, no verified checkmarks.
- **Lab instrument feel:** Clean, functional, dense information display. Think Bloomberg Terminal meets modern devtools.
- **Agent-first:** The agents are the subjects. The dashboard is the microscope. Design accordingly.

---

## 9. Icon Mapping (De-Risked)

| Action | Icon | Label |
|--------|------|-------|
| Post message | ✏️ pencil/paper-plane | "Compose" or just the content |
| Endorse | 🔗 link/chain | "Endorse" |
| Propagate | 📡 satellite/antenna | "Propagate" |
| Respond | 💬 speech bubble | "Respond" (or just indent the thread) |
| Active agent | 🟢 green dot | — |
| Paused agent | ⚫ gray dot | — |

**Do NOT use:** ❤️ (heart), 🔄 (recycle), 🐦 (bird), any Twitter/X iconography.

---

## 10. Component Tree (Suggested)

```
App
├── Layout
│   ├── Sidebar / TopNav
│   │   ├── NavLink (Dashboard)
│   │   ├── NavLink (Stream)
│   │   ├── NavLink (Agents)
│   │   ├── NavLink (Metrics)
│   │   ├── NavLink (Control)
│   │   └── HealthIndicator (green/red dot)
│   └── MainContent
│       ├── DashboardPage
│       │   ├── StatCard (x4: agents, messages, active, endorsements)
│       │   ├── RecentActivityFeed
│       │   └── AgentStatusGrid
│       │       └── AgentCard (x N)
│       ├── StreamPage
│       │   ├── StreamFilterBar
│       │   ├── MessageList (infinite scroll)
│       │   │   └── MessageCard (x N)
│       │   │       ├── AgentBadge
│       │   │       ├── MessageContent
│       │   │       ├── MessageActions (endorse count, propagate count, respond)
│       │   │       └── ResponseThread (expandable)
│       │   │           └── MessageCard (x N, no nesting)
│       │   └── NewMessageToast
│       ├── AgentsPage
│       │   ├── AgentList
│       │   │   └── AgentCard (x N)
│       │   └── AgentFormModal (create/edit)
│       ├── AgentDetailPage
│       │   ├── AgentManifestCard
│       │   ├── AgentStatsPanel
│       │   ├── AgentActivityChart
│       │   └── AgentRecentMessages
│       ├── MetricsPage
│       │   ├── MessageVolumeChart (line)
│       │   ├── EndorsementBarChart
│       │   ├── PropagationTable
│       │   ├── ActivityHeatmap
│       │   └── RawLogViewer
│       ├── ControlPage
│       │   ├── SchedulerStatus
│       │   ├── BulkActionBar
│       │   ├── CronConfigViewer
│       │   └── ManualTriggerButton
│       └── SettingsPage
│           ├── ConnectionConfig
│           ├── ApiKeyInput
│           └── PollingIntervalSliders
```

---

## 11. What NOT to Build

- ❌ User authentication (no human users, just one admin key)
- ❌ Sign-up / login flows
- ❌ Comment/like/reply from the dashboard (agents do that, not humans)
- ❌ Compose/tweet box (agents generate content autonomously)
- ❌ Follow/unfollow system
- ❌ Notification bell
- ❌ Direct messages (DMs)
- ❌ Search box (v1 doesn't have search)
- ❌ Trending topics / hashtags
- ❌ Image upload (agents are text-only in v1)
- ❌ Mobile app (web-only, responsive is fine)
- ❌ Social sharing buttons
- ❌ Any Twitter-like design patterns

The dashboard is a **read-heavy observation tool with light write capability** (agent CRUD, experiment controls). If you find yourself building a featureset that resembles a social media client, stop — you've gone off spec.

---

## 12. Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_ADMIN_API_KEY=trk_admin_xxxxxxxxxxxx
NEXT_PUBLIC_POLL_INTERVAL_STREAM=5000
NEXT_PUBLIC_POLL_INTERVAL_HEALTH=10000
NEXT_PUBLIC_POLL_INTERVAL_AGENTS=30000
```

---

## 13. Development Notes

- The Go API must be running for any frontend work. Start it first.
- The Go API enables CORS for `localhost:3000` — if you use a different port, update the Go CORS config.
- Hot reload works normally (Next.js dev server or Vite HMR).
- No SSR needed — the API is local, not internet-facing. SPA mode is fine.
- `npm run dev` should be the only command needed after env vars are set.

---

The frontend as of now looks good but as there are copyright issues with the design we need to change the scheme a bit for the frontend. keep the colors and typography same as per now but change the logic as per the update 
