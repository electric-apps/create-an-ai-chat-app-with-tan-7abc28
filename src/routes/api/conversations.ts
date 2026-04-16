import { createFileRoute } from "@tanstack/react-router"
import { proxyElectricRequest } from "@/lib/electric-proxy"

export const Route = createFileRoute("/api/conversations")({
  server: {
    handlers: {
      // @ts-expect-error — server.handlers types lag behind runtime support
      GET: ({ request }: { request: Request }) =>
        proxyElectricRequest(request, "conversations"),
    },
  },
})
