# AI Chat (TanStack AI + Durable Transport)

A single-user AI chat app built with **TanStack Start**, **TanStack AI**, and **Durable Streams**. Conversations are persistent, resumable, and live-synced via Electric SQL. Users supply their own Anthropic API key at runtime (stored in `localStorage`) and chat with Claude models.

## What's inside

- **Sidebar** — live-synced list of conversations (Electric shape + TanStack DB live query). Create / rename / delete inline.
- **Chat page** — streams Claude responses through a Durable Stream. Refresh mid-generation and it picks up where it left off.
- **Settings dialog** — enter/clear your Anthropic API key. Stored only in your browser's `localStorage`, sent as an `x-api-key` header to this app's server when chatting. Never logged or persisted server-side.
- **API key banner** — sticky warning when no key is configured.

## Stack

| Concern | Tech |
|---|---|
| Framework | TanStack Start (React + file routes) |
| Sidebar sync | Electric SQL shapes → TanStack DB → `useLiveQuery` |
| Chat transport | `@durable-streams/tanstack-ai-transport` + `@tanstack/ai-react` |
| Model adapter | `@tanstack/ai-anthropic` (Claude Sonnet 4.5) |
| Database | Postgres (Neon) via Drizzle ORM |
| UI | shadcn/ui + Tailwind + lucide-react |

## Data model

A single Postgres table: `conversations (id, title, stream_id, created_at, updated_at)`. There is **no** `messages` table — chat history lives in the durable stream identified by `stream_id`. The stream is the source of truth for messages; `conversations` is just metadata for the sidebar.

## Run it

```bash
pnpm install
pnpm drizzle-kit migrate   # applies the conversations schema
pnpm dev:start             # starts Caddy (HTTPS) + Vite
```

Open **https://localhost:5362** (or the preview URL shown by the orchestrator). If the browser shows a cert warning, run `pnpm trust-cert` from the Electric Studio repo root once per machine and reopen.

Stop with `pnpm dev:stop`.

## Environment

All values live in `.env` (auto-populated by the orchestrator's SecretStore):

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `ELECTRIC_URL` | Electric Cloud root (e.g. `https://api.electric-sql.cloud`) |
| `ELECTRIC_SOURCE_ID` | Electric shape source id |
| `ELECTRIC_SECRET` | Electric shape auth secret |
| `DS_SERVICE_ID` | Durable Streams service id |
| `DS_SECRET` | Durable Streams bearer token |

The user's `ANTHROPIC_API_KEY` is **not** an env var — it's supplied per-request from the client via the `x-api-key` header.

## Routes

| Route | Kind | Purpose |
|---|---|---|
| `/` | page | Empty-state landing |
| `/chat/$conversationId` | page | Chat with Claude |
| `/api/conversations` | server (GET) | Electric shape proxy |
| `/api/conversations/mutate` | server (POST/PUT/DELETE) | Create / rename / delete conversations (optimistic mutations with txid) |
| `/api/chat` | server (POST) | Forwards user message + streams Claude into the durable stream |
| `/api/chat-stream` | server (GET) | Read proxy for the durable stream (keeps DS secret server-side) |

## Scripts

```bash
pnpm test          # vitest — schema validation
pnpm run build     # prebuild preflight + nitro build
pnpm dev:restart   # stop + start
```
