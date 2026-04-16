# PLAN.md — AI Chat App (TanStack AI + Durable Transport)

## App Description

A single-user AI chat application built with TanStack Start and TanStack AI. Users enter their Anthropic API key once (persisted in `localStorage`), create named conversations, and chat with Claude models. Conversations are persistent and resumable — chat history survives page refreshes and reconnects mid-stream.

---

## User Flows

### 1. First-time setup
1. User lands on the app.
2. A settings panel/banner prompts them to enter their Anthropic API key.
3. User pastes key → it is saved to `localStorage`. The banner disappears.

### 2. Create a conversation
1. User clicks "New Chat" in the sidebar.
2. A new conversation record is created in Postgres (with a default title like "New Chat").
3. User is navigated to the conversation page.

### 3. Chat
1. User types a message and presses Enter or clicks Send.
2. Message is appended to the durable stream via the AI route handler.
3. Claude responds, streaming tokens in real time through the durable transport.
4. Conversation history is hydrated from the durable stream on page load — chat is fully persistent.

### 4. Manage conversations
1. Sidebar lists all conversations ordered by most recently updated.
2. User can rename a conversation (inline edit or dialog).
3. User can delete a conversation.

### 5. Change API key
1. User clicks a settings icon (bottom of sidebar).
2. A settings dialog lets them update or clear the stored API key.

---

## Data Model

```ts
// src/db/schema.ts

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull().default("New Chat"),
  stream_id: text("stream_id").notNull().unique(), // durable stream ID for this conversation
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

> **Note:** There is no `messages` table. Chat history lives in the durable stream identified by `stream_id`. The `conversations` table is Electric-synced for the sidebar list.

---

## Key Technical Decisions

| Problem | Product | Package |
|---|---|---|
| Conversation list (sidebar, live updates) | Electric shapes + TanStack DB | `@electric-sql/client` + `@tanstack/db` |
| Persistent, resumable AI chat | Durable Transport for TanStack AI | `@durable-streams/tanstack-ai-transport` |
| Schema + migrations | Drizzle ORM | `drizzle-orm` + `drizzle-kit` |
| Full-stack React framework | TanStack Start | `@tanstack/react-start` |
| UI components | shadcn/ui + Tailwind | `@/components/ui/*` |

**Why durable transport over plain SSE?**
Durable transport writes every AI response chunk to a persistent stream. If the user refreshes mid-generation, the client reconnects to the stream and picks up from the last received offset — no lost tokens, no replay needed.

**Why no messages table in Postgres?**
The durable stream is the source of truth for messages. Storing them in Postgres too would create a sync problem. The stream is append-only, ordered, and durable — perfect for chat.

**API key handling:**
The key is stored in `localStorage` on the client. Each chat request sends it to the server-side API route as a request header (`x-api-key`). The server uses it to call the Anthropic API. The key never leaves the browser except in direct calls to our own API route. The server route NEVER logs or persists it.

---

## Phase 0: Infrastructure

- [ ] Provision Postgres + Electric source via Electric CLI (`services create postgres`) → store `DATABASE_URL`, `ELECTRIC_SOURCE_ID`, `ELECTRIC_SECRET`
- [ ] Provision Durable Streams service via Electric CLI (`services create streams`) → store `DS_SERVICE_ID`, `DS_SECRET`
- [ ] Write all credentials to `.env` via `set_secret`

---

## Required Skills

The coder must read these intent skills (in node_modules) before writing any code:

### Always required
- `node_modules/@electric-sql/client/skills/electric-new-feature/SKILL.md`
- `node_modules/@tanstack/db/skills/db-core/SKILL.md`
- `node_modules/@tanstack/db/skills/db-core/live-queries/SKILL.md`
- `node_modules/@tanstack/db/skills/db-core/collection-setup/SKILL.md`

### For this app
- `node_modules/@durable-streams/tanstack-ai-transport/skills/tanstack-ai/SKILL.md` — AI chat transport + provisioning steps
- `node_modules/@tanstack/start-client-core/skills/start-core/SKILL.md` — TanStack Start routing
- `node_modules/@tanstack/start-client-core/skills/start-core/server-routes/SKILL.md` — server route for AI proxy

---

## Implementation Tasks

### Phase 1: Schema, Migrations, and Infrastructure
- [ ] Define `conversations` table in Drizzle schema (`src/db/schema.ts`)
- [ ] Generate and run initial migration with `drizzle-kit`
- [ ] Create Electric shape proxy route for conversations (`src/routes/api/shape-proxy.ts`)
- [ ] Verify Electric sync is working for conversations shape

### Phase 2: Core UI Shell
- [ ] Create root layout with sidebar + main content area (`src/routes/__root.tsx`)
- [ ] Build sidebar component listing all conversations via TanStack DB live query
- [ ] "New Chat" button that creates a conversation record and navigates to it
- [ ] Conversation rename: inline edit on the sidebar item
- [ ] Conversation delete: button with confirmation
- [ ] Settings icon at bottom of sidebar opens a settings dialog

### Phase 3: Settings Dialog — API Key Management
- [ ] Build settings dialog component (`src/components/Settings.tsx`)
- [ ] On first load, if no API key in localStorage, show a sticky banner prompting the user to enter one
- [ ] Settings dialog: input for Anthropic API key, save to localStorage, clear button
- [ ] Expose a React context/hook (`useApiKey`) so chat components can read the key

### Phase 4: Chat Page + AI Transport
- [ ] Create conversation route (`src/routes/chat.$conversationId.tsx`) with `ssr: false`
- [ ] Server-side API route for AI chat (`src/routes/api/chat.ts`):
  - Reads `x-api-key` header and `stream_id` from the request
  - Uses `@durable-streams/tanstack-ai-transport` to write the response to the durable stream
  - Calls Anthropic API using the provided key + Claude model
- [ ] Wire up TanStack AI `useChat()` with the durable transport on the chat page
- [ ] Display streaming message list with a user bubble and an AI bubble
- [ ] Message input bar (textarea + send button, Enter to send)
- [ ] Auto-scroll to latest message

### Phase 5: Conversation Lifecycle
- [ ] On "New Chat": generate a unique `stream_id` (UUID), create conversation row via API route, navigate to chat page
- [ ] Update conversation's `updated_at` on each new message so the sidebar sorts correctly
- [ ] Auto-generate a conversation title from the first user message (truncate to 40 chars) via a server function

### Phase 6: Polish
- [ ] Empty state on the home page ("Select a conversation or start a new one")
- [ ] Loading states: skeleton while conversations list loads, spinner while AI responds
- [ ] Error handling: if API key is missing when user tries to send, show the settings dialog
- [ ] Error handling: surface Anthropic API errors (invalid key, rate limit) as a toast

---

## Parallel Work

### Sequential (must be in order)
1. Phase 0 — Infrastructure (credentials must be available before any server code runs)
2. Phase 1 — Schema + migrations (database must exist before Electric sync)
3. Phase 2, Step 1 — Root layout shell (other UI phases depend on the layout)

### Parallel Group A (after root layout)
- [ ] Phase 2 (remaining) — Sidebar, conversation list, rename/delete
- [ ] Phase 3 — Settings dialog + API key context

### Parallel Group B (after Group A)
- [ ] Phase 4 — Chat page + AI transport (depends on API key context from Phase 3)
- [ ] Phase 5 — Conversation lifecycle helpers

### Parallel Group C (after Group B — final polish)
- [ ] Phase 6 — Empty states, loading states, error handling, toasts
- [ ] Write `README.md`
