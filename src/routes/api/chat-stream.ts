import { createFileRoute } from "@tanstack/react-router"
import { ensureDurableChatSessionStream } from "@durable-streams/tanstack-ai-transport"
import { DS_AUTH, DS_BASE } from "@/lib/ds-stream"

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-encoding",
  "content-length",
])

async function handleGET({ request }: { request: Request }) {
  const url = new URL(request.url)
  const id = url.searchParams.get("id")
  if (!id) return Response.json({ error: "Missing id" }, { status: 400 })

  const upstream = new URL(`${DS_BASE}/chat-${id}`)
  for (const [k, v] of url.searchParams) {
    if (k !== "id") upstream.searchParams.set(k, v)
  }

  const accept = request.headers.get("accept")
  const doFetch = () =>
    fetch(upstream, {
      headers: {
        ...DS_AUTH,
        ...(accept ? { Accept: accept } : {}),
      },
    })

  let response = await doFetch()

  // Stream doesn't exist yet — heal by creating it upstream, then retry once.
  // This covers conversations created before eager-create was wired up, and
  // any race where the read arrives before the POST /mutate finishes.
  if (response.status === 404) {
    try {
      await ensureDurableChatSessionStream({
        writeUrl: `${DS_BASE}/chat-${id}`,
        headers: DS_AUTH,
        createIfMissing: true,
      })
      response = await doFetch()
    } catch (err) {
      console.error("chat-stream: failed to auto-create stream", err)
    }
  }

  const headers = new Headers()
  for (const [k, v] of response.headers) {
    if (HOP_BY_HOP.has(k.toLowerCase())) continue
    headers.set(k, v)
  }
  return new Response(response.body, { status: response.status, headers })
}

export const Route = createFileRoute("/api/chat-stream")({
  server: {
    handlers: {
      // @ts-expect-error — server.handlers types lag behind runtime support
      GET: handleGET,
    },
  },
})
