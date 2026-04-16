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

**Last run:** 2026-04-16 FAIL — When navigating to the "teste" conversation, chat heading showed "New Chat" instead of "teste". Confirmed the sidebar correctly showed "teste" (Electric-synced). The heading only updates correctly after the first message is sent (at which point auto-title overrides it). Conversations with titles set via rename show the wrong title in the chat heading.

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

### T11: Send message — user bubble and auto-title
**Steps:**
1. Set an API key in Settings
2. Navigate to a New Chat conversation
3. Type a message in the input
4. Click Send
5. Verify the user message appears as a chat bubble
6. Verify the conversation title in sidebar auto-updates to the first message text (truncated)
7. Verify the chat heading also updates

**Expected:** User message bubble visible, auto-title set from first message in both sidebar and heading

**Last run:** 2026-04-16 PASS (user flow) / FAIL (AI response) — User message bubble appears. Auto-title updated to "Hello Claude" in both sidebar and heading. Chat input clears and disables (waiting for response). BUT: no AI response received — the Durable Streams transport returns 404 on `/api/chat-stream?id=<stream_id>&offset=-1&live=sse` for every page load. No error toast is shown to the user (silent failure). NOTE: the fake key used for testing would produce an auth error even if the transport worked; the critical issue is the missing error feedback.

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

**Last run:** 2026-04-16 FAIL — Multiple `Failed to load resource: 404` errors for `/api/chat-stream?id=<stream_id>&offset=-1&live=sse` appear in console on every visit to a chat page before the first message is sent. The client retries repeatedly. After first message is sent, subsequent page loads show 0 errors. The stream endpoint should handle the "not yet created" case gracefully (e.g. return empty 200, not 404).

---

### T14: Chat history persists on page refresh
**Steps:**
1. Send a message in a conversation
2. Hard-navigate (reload) to the same conversation URL
3. Verify the user message is still visible

**Expected:** User message reappears after reload (durable transport working)

**Last run:** 2026-04-16 PASS — After sending "Hello Claude" and reloading the page, the user message bubble was still visible. Conversation title also preserved. 0 console errors on reload.

---

## Summary (2026-04-16 run)

| ID | Name | Status |
|----|------|--------|
| T1 | Smoke — app loads | PASS |
| T2 | API key banner on fresh load | PASS |
| T3 | Settings button opens dialog | PASS |
| T4 | Save API key hides banner | PASS |
| T5 | "Add key" banner button opens settings | PASS |
| T6 | New Chat creates conversation | PASS |
| T7 | Clear API key restores banner | PASS |
| T8 | Chat heading matches conversation title | **FAIL** |
| T9 | Rename conversation | PASS |
| T10 | Delete conversation | PASS |
| T11 | Send message — user bubble + auto-title | PASS / **FAIL** (AI response + silent error) |
| T12 | Input disabled without API key | PASS |
| T13 | Chat stream 404 before first message | **FAIL** |
| T14 | Chat history persists on reload | PASS |

**11/14 passed. 3 failures.**
