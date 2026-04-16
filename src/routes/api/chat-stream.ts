import { createFileRoute } from "@tanstack/react-router"
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
  const response = await fetch(upstream, {
    headers: {
      ...DS_AUTH,
      ...(accept ? { Accept: accept } : {}),
    },
  })

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
