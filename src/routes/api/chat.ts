import { createFileRoute } from "@tanstack/react-router"
import { chat } from "@tanstack/ai"
import { anthropicText } from "@tanstack/ai-anthropic"
import { toDurableChatSessionResponse } from "@durable-streams/tanstack-ai-transport"
import { eq } from "drizzle-orm"
import { DS_AUTH, DS_BASE } from "@/lib/ds-stream"
import { db } from "@/db"
import { conversations } from "@/db/schema"

async function handlePOST({ request }: { request: Request }) {
  const url = new URL(request.url)
  const body = await request.json()
  const id = url.searchParams.get("id") ?? body.id
  if (!id) return Response.json({ error: "Missing chat id" }, { status: 400 })

  const apiKey = request.headers.get("x-api-key")
  if (!apiKey)
    return Response.json(
      { error: "Missing Anthropic API key. Add it in Settings." },
      { status: 401 },
    )
  process.env.ANTHROPIC_API_KEY = apiKey

  const model =
    (typeof body.model === "string" && body.model) || "claude-sonnet-4-5"

  const messages = Array.isArray(body.messages) ? body.messages : []
  const latestUserMessage = [...messages]
    .reverse()
    .find((m: { role: string }) => m.role === "user")

  // Bump updated_at + set title from first user message when still default
  try {
    if (latestUserMessage) {
      const firstText = (latestUserMessage.parts ?? [])
        .filter((p: { type: string }) => p.type === "text")
        .map((p: { content?: string }) => p.content ?? "")
        .join("")
        .trim()

      await db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(conversations)
          .where(eq(conversations.stream_id, id))
          .limit(1)
        if (!existing) return
        const patch: { updated_at: Date; title?: string } = {
          updated_at: new Date(),
        }
        if (existing.title === "New Chat" && firstText) {
          patch.title = firstText.slice(0, 40)
        }
        await tx
          .update(conversations)
          .set(patch)
          .where(eq(conversations.id, existing.id))
      })
    }
  } catch (err) {
    console.error("Failed to update conversation metadata", err)
  }

  try {
    const responseStream = chat({
      adapter: anthropicText(model),
      messages,
    })

    return await toDurableChatSessionResponse({
      stream: {
        writeUrl: `${DS_BASE}/chat-${id}`,
        headers: DS_AUTH,
        createIfMissing: true,
      },
      newMessages: latestUserMessage ? [latestUserMessage] : [],
      responseStream,
      mode: "await",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("Chat handler failed:", message)
    const status = /401|unauthoriz|invalid.*api.*key/i.test(message)
      ? 401
      : /429|rate.?limit/i.test(message)
        ? 429
        : 500
    return Response.json({ error: message }, { status })
  }
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      // @ts-expect-error — server.handlers types lag behind runtime support
      POST: handlePOST,
    },
  },
})
