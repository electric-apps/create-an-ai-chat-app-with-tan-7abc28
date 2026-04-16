# QA Test Plan

Generated: 2026-04-16
Based on: PLAN.md (latest on branch agent/coder-760358)

## Test Cases

### T1: Smoke — App loads without errors
**Steps:**
1. Navigate to http://localhost:5180
2. Verify main page renders
3. Check browser console for JS errors

**Expected:** Page loads, sidebar visible, welcome state shown, no JS errors

**Last run:** 2026-04-16 PASS — App loads, title "AI Chat", sidebar with New Chat + Settings rendered. 0 console errors.

---

### T2: API key banner visible on fresh load (no key set)
**Steps:**
1. Clear API key (or start fresh with none set)
2. Navigate to home
3. Verify banner "Add your Anthropic API key to start chatting." is visible with an "Add key" button

**Expected:** Banner is visible, "Add key" button present

**Last run:** 2026-04-16 PASS — Banner with "Add key" button shown on home page when no key is stored.

---

### T3: Settings button opens settings dialog
**Steps:**
1. Navigate to home
2. Click "Settings" button at bottom of sidebar
3. Verify a dialog opens with an API key input and Save/Clear/Close buttons

**Expected:** Settings dialog appears with heading "Settings", textbox for API key, Save and Clear buttons

**Last run:** 2026-04-16 PASS — Settings dialog opens with all expected controls.

---

### T4: Save API key hides banner
**Steps:**
1. Open Settings dialog
2. Type an API key into the input
3. Click "Save"
4. Verify the "Add your Anthropic API key" banner disappears

**Expected:** Dialog closes, banner gone, key stored in localStorage

**Last run:** 2026-04-16 PASS — After saving, dialog closes and the banner disappears.

---

### T5: "Add key" banner button opens settings
**Steps:**
1. Ensure no API key is set (banner visible)
2. Click "Add key" button in the banner
3. Verify the Settings dialog opens

**Expected:** Settings dialog opens

**Last run:** 2026-04-16 PASS — "Add key" button opens the Settings dialog correctly.

---

### T6: New Chat creates conversation and navigates
**Steps:**
1. Click "New Chat" button in sidebar
2. Verify a new conversation appears at the top of the sidebar list
3. Verify URL changes to /chat/<id>
4. Verify chat input area is visible

**Expected:** New conversation in sidebar, URL changes, chat page with message input shown

**Last run:** 2026-04-16 PASS — New Chat creates a conversation with title "New Chat", navigates to /chat/<uuid>, chat input visible.

---

### T7: Clear API key restores banner
**Steps:**
1. Ensure API key is saved (banner hidden)
2. Open Settings dialog
3. Click "Clear"
4. Verify banner reappears

**Expected:** Banner "Add your Anthropic API key to start chatting." reappears immediately

**Last run:** 2026-04-16 PASS — Clicking Clear in Settings immediately restores the API key banner.

---

### T8: Chat page heading matches conversation title
**Steps:**
1. Navigate to an existing conversation that has been renamed
2. Verify the chat heading matches the conversation's current title

**Expected:** Chat page `<h1>` shows the same title as the sidebar link

**Last run:** 2026-04-16 PASS (run 2) — Confirmed correct for "Say hello in one word" (heading matches sidebar). The original FAIL in run 1 was a false positive caused by T15: client-side navigation doesn't re-render the chat component, so the heading was actually from the previously-viewed conversation. Hard navigation always shows the correct title.

---

### T9: Rename conversation — inline edit
**Steps:**
1. Hover/find the Rename button on a conversation in the sidebar
2. Click Rename
3. Verify the link becomes an inline text input pre-filled with the current name
4. Type a new name and press Enter
5. Verify the sidebar now shows the new name

**Expected:** Conversation title updates in sidebar

**Last run:** 2026-04-16 PASS — Clicking Rename shows an inline input with current title pre-filled. After typing new name and pressing Enter, sidebar updates to new title. Conversation also moved to top of list (updated_at updated).

---

### T10: Delete conversation — confirm and remove
**Steps:**
1. Click Delete on a conversation in the sidebar
2. Verify a confirmation dialog appears
3. Accept the dialog
4. Verify the conversation is removed from the sidebar
5. Verify user is redirected (not left on the deleted conversation's page)

**Expected:** Conversation removed, user redirected to home

**Last run:** 2026-04-16 PASS — Delete button shows browser confirm dialog "Delete this conversation?". On accept, conversation removed from sidebar and user redirected to home (/). Welcome state shown.

---

### T11: Send message — user bubble, AI response, auto-title
**Steps:**
1. Set an API key in Settings
2. Navigate to a New Chat conversation
3. Type a message in the input
4. Click Send
5. Verify the user message appears as a chat bubble immediately
6. Verify Claude response streams in within a few seconds
7. Verify the conversation title in sidebar auto-updates to the first message text (truncated to 40 chars)
8. Verify the chat heading also updates

**Expected:** User message bubble visible immediately, Claude response streams in, auto-title set from first message in both sidebar and heading

**Last run:** 2026-04-16 FAIL (live streaming) / PASS (persistence) — Tested with real API key. User message appears immediately ✓. Auto-title fires instantly ✓ (truncated to 40 chars: "Reply with exactly three words: red gree"). However: Claude response does NOT appear during the session — the SSE stream connection fails with 404 before the first write (T13), and the client never recovers. Response only becomes visible after a hard page reload. After reload: both user bubble and Claude response ("red green blue") visible ✓, 0 console errors ✓. Root cause: same as T13 — the live read connection 404s before the first message is written; fixing T13 will also fix live streaming.

---

### T12: Message input disabled without API key
**Steps:**
1. Ensure no API key is set
2. Navigate to a chat conversation
3. Verify message input shows a "Add your API key" placeholder
4. Verify the Send button is disabled

**Expected:** Input shows key-missing placeholder, Send button disabled

**Last run:** 2026-04-16 PASS — With no API key, input placeholder reads "Add your API key in Settings to chat…" and Send button is disabled. Once text is typed, Send button remains disabled (correct — key check takes priority).

---

### T13: Chat stream 404 errors in console
**Steps:**
1. Create a new conversation
2. Navigate to it (before sending any messages)
3. Check browser console

**Expected:** No console errors; stream "not yet created" should be handled gracefully

**Last run:** 2026-04-16 FAIL (run 3, root cause confirmed) — Hard-navigating to a chat page produces 2+ `Failed to load resource: 404` errors for `/api/chat-stream?id=<stream_id>&offset=-1&live=sse`. The stream doesn't exist until the first message is written. The client's SSE connection fails on this 404 and does NOT reconnect after the stream is created. This has a cascading effect: Claude's streaming response is never shown to the user during the session (T11) — only visible after a full page reload. Fix: the `/api/chat-stream` route (or the Durable Streams proxy) should return a 200 with an empty SSE body when the stream doesn't exist yet, so the client stays connected and picks up the first write.

---

### T14: Chat history persists on page refresh
**Steps:**
1. Send a message in a conversation
2. Hard-navigate (reload) to the same conversation URL
3. Verify the user message is still visible

**Expected:** User message reappears after reload (durable transport working)

**Last run:** 2026-04-16 PASS — After sending "Hello Claude" and reloading the page, the user message bubble was still visible. Conversation title also preserved. 0 console errors on reload.

---

### T15: Client-side navigation updates chat content
**Steps:**
1. Navigate to a conversation with messages (e.g. "Say hello in one word")
2. Click a different conversation in the sidebar (not a hard reload)
3. Verify the main content area updates to show the newly selected conversation

**Expected:** Chat content area rerenders with the new conversation's messages and heading

**Last run:** 2026-04-16 FAIL — After clicking a sidebar link, the URL and sidebar highlight update correctly but the chat content area stays frozen on the previously viewed conversation. Confirmed with screenshot: URL = `/chat/d9430311-...` (empty "New Chat"), but heading and messages still showed "Say hello in one word". Hard navigation (page.goto) correctly shows the right content. Root cause: TanStack Start chat route component is not remounting or reloading data on client-side `conversationId` param change.

---

## Summary (2026-04-16 run 2)

| ID | Name | Status |
|----|------|--------|
| T1 | Smoke — app loads | PASS |
| T2 | API key banner on fresh load | PASS |
| T3 | Settings button opens dialog | PASS |
| T4 | Save API key hides banner | PASS |
| T5 | "Add key" banner button opens settings | PASS |
| T6 | New Chat creates conversation | PASS |
| T7 | Clear API key restores banner | PASS |
| T8 | Chat heading matches conversation title | PASS |
| T9 | Rename conversation | PASS |
| T10 | Delete conversation | PASS |
| T11 | Send message — user bubble + AI response + auto-title | PASS (persistence) / **FAIL** (live stream) |
| T12 | Input disabled without API key | PASS |
| T13 | Chat stream 404 before first message | **FAIL** |
| T14 | Chat history persists on reload | PASS |
| T15 | Client-side nav updates chat content | **FAIL** |

**12/15 passed. 3 failures (T11 live streaming, T13, T15). T11 and T13 share the same root cause.**
