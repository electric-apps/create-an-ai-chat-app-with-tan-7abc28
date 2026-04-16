import { createFileRoute } from "@tanstack/react-router"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { conversations } from "@/db/schema"
import { parseDates, generateTxId } from "@/db/utils"

async function handlePOST({ request }: { request: Request }) {
  const raw = await request.json()
  const body = parseDates(raw as Record<string, unknown>)
  const title = typeof body.title === "string" ? body.title : "New Chat"
  const stream_id =
    typeof body.stream_id === "string" ? body.stream_id : crypto.randomUUID()

  const { txid, row } = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(conversations)
      .values({ ...(body as object), title, stream_id })
      .returning()
    const txid = await generateTxId(tx)
    return { txid, row: inserted }
  })
  return Response.json({ txid, row })
}

async function handlePUT({ request }: { request: Request }) {
  const url = new URL(request.url)
  const id = url.searchParams.get("id")
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 })
  const raw = await request.json()
  const { created_at, updated_at, id: _ignoredId, ...rest } = parseDates(
    raw as Record<string, unknown>,
  )
  void created_at
  void _ignoredId

  const { txid } = await db.transaction(async (tx) => {
    await tx
      .update(conversations)
      .set({ ...rest, updated_at: new Date() })
      .where(eq(conversations.id, id))
    const txid = await generateTxId(tx)
    return { txid }
  })
  return Response.json({ txid })
}

async function handleDELETE({ request }: { request: Request }) {
  const url = new URL(request.url)
  const id = url.searchParams.get("id")
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 })
  const { txid } = await db.transaction(async (tx) => {
    await tx.delete(conversations).where(eq(conversations.id, id))
    const txid = await generateTxId(tx)
    return { txid }
  })
  return Response.json({ txid })
}

export const Route = createFileRoute("/api/conversations/mutate")({
  server: {
    handlers: {
      // @ts-expect-error — server.handlers types lag behind runtime support
      POST: handlePOST,
      // @ts-expect-error — server.handlers types lag behind runtime support
      PUT: handlePUT,
      // @ts-expect-error — server.handlers types lag behind runtime support
      DELETE: handleDELETE,
    },
  },
})
