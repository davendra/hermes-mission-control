# Hermes Mission Control

A web dashboard for running and monitoring a fleet of Hermes AI agents. Each agent
posts a status heartbeat (and, optionally, its recent conversations) to this app, and
you get one pane of glass: who's online, what they're doing, what they've cost, their
missions, the ideas they've surfaced, and full conversation transcripts.

> Started from the Max HQ-style template by [@sharbelxyz](https://x.com/sharbelxyz)
> and extended with auth, per-agent detail pages, and in-app conversation transcripts.

## What it does

- **Dashboard** (`/`) — KPIs (agents online, tasks completed, pending missions, ideas to review) plus per-agent cards, all clickable.
- **Agents** (`/agents`) — table of every agent: status, role, current task, tasks, cost, last active.
- **Agent detail** (`/agents/[id]`) — stats, recent-activity feed, this agent's missions (with their results), its conversations, and an **"Open live console"** deep-link to the agent's own dashboard.
- **Transcripts** (`/agents/[id]/sessions/[sid]`) — the actual messages a conversation contained, colour-coded by role (user / assistant / tool).
- **Missions** (`/missions`) — the work queue, with completed missions' results rendered inline.
- **Ideas** (`/ideas`) — ideas agents queued up for review.

## Stack

- **Next.js 16** (App Router, React 19)
- **Prisma 6** on Postgres — built + deployed on **Neon**; Supabase / Vercel Postgres / local also work
- **Tailwind CSS v4**
- **Auth:** HTTP Basic Auth on the UI (middleware) + Bearer-token auth on the API

## Auth

Two layers, both env-driven:

- **Dashboard UI** — HTTP Basic Auth via `src/middleware.ts`. Set `DASHBOARD_USER` / `DASHBOARD_PASS`. If they're unset the gate is a no-op (convenient for local dev). API routes are exempt from this gate (they use their own token).
- **API** — every `/api/agents/*` call requires `Authorization: Bearer $INTERNAL_API_SECRET`. `GET /api/health` stays open for uptime monitors.

## API

| Route | Auth | Purpose |
|---|---|---|
| `POST /api/agents/state` | Bearer | Upsert one agent's status snapshot (the heartbeat) |
| `GET /api/agents/state` | Bearer | List all agents |
| `POST /api/agents/sessions` | Bearer | Push an agent's recent conversations + transcripts |
| `GET /api/health` | none | `{ ok, db }` for uptime checks |

## Data model (Prisma)

- `AgentState` — one row per agent: `status`, `role`, `currentTask`, `tasksCompleted`, `totalCost`, `recentActivity[]`, and `dashboardUrl` (deep-link to the agent's own console).
- `Mission` — a unit of work for an agent (`title`, `status`, `priority`, `result`).
- `Idea` — an idea an agent surfaced for review.
- `AgentSession` — a conversation, transcript stored as a JSON `messages` array, pushed in from the agent's store.
- `DataStore` — generic key/value scratch.

## Quick start (local)

```bash
git clone https://github.com/davendra/hermes-mission-control.git
cd hermes-mission-control
npm install
cp .env.example .env      # fill in the vars below
npx prisma db push        # create the tables
npm run seed:demo         # optional: sample agents / missions / ideas
npm run dev               # http://localhost:3000
```

Environment variables (`.env.example`):

| Var | What |
|---|---|
| `DATABASE_URL` | Postgres connection string (Neon / Supabase / local) |
| `INTERNAL_API_SECRET` | Bearer secret agents use for the API — `openssl rand -hex 32` |
| `DASHBOARD_USER` / `DASHBOARD_PASS` | Basic Auth login for the UI — pass via `openssl rand -base64 18` |

## Wiring an agent to it

**1) Heartbeat** — each agent POSTs its status on a timer:

```bash
curl -X POST "$MC_URL/api/agents/state" \
  -H "Authorization: Bearer $INTERNAL_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"id":"my-agent","name":"My Agent","status":"working",
       "currentTask":"drafting a thread","tasksCompleted":42,"totalCost":3.14,
       "dashboardUrl":"https://my-agent.example.com/login"}'
```

Upserts are partial: fields you omit are left unchanged (a heartbeat that doesn't send
`tasksCompleted` won't reset it). `status` is one of `online | idle | working | offline | error`.

**2) Conversations (optional)** — push recent sessions so transcripts show up in-app:

```bash
curl -X POST "$MC_URL/api/agents/sessions" \
  -H "Authorization: Bearer $INTERNAL_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"agentId":"my-agent","sessions":[
        {"sourceId":"sess-1","source":"telegram","title":"Greeting","messageCount":2,
         "costUsd":0.42,"startedAt":"2026-07-01T08:00:00Z",
         "messages":[{"role":"user","content":"hi","timestamp":"2026-07-01T08:00:01Z"},
                     {"role":"assistant","content":"hey!","timestamp":"2026-07-01T08:00:03Z"}]}]}'
```

A working reference for a real agent — Hermes on a DigitalOcean droplet, reporting via
two systemd timers (`hermes-report-state.sh` for the heartbeat, `hermes-sync-sessions.py`
for conversation sync) — lives in the companion **Hermes-DO** repo.

## Deploy (Vercel + Neon)

```bash
vercel link                          # create/link the project
vercel integration add neon          # provisions Postgres, injects DATABASE_URL
vercel env add INTERNAL_API_SECRET   # also DASHBOARD_USER / DASHBOARD_PASS (all environments)
npx prisma db push                   # against the Neon DB
vercel deploy --prod
```

`vercel git connect` makes pushes to `main` auto-deploy. The build runs
`prisma generate && next build`.

## Editing with Claude Code

See `CLAUDE.md`. `BOOTSTRAP.md` has the original template's extension guide.

## License

MIT.
