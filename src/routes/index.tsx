import { createFileRoute } from "@tanstack/react-router"
import { MessageSquare } from "lucide-react"

export const Route = createFileRoute("/")({
  ssr: false,
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex flex-1 items-center justify-center text-center">
      <div className="max-w-sm space-y-3 p-8">
        <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Welcome to AI Chat</h1>
        <p className="text-sm text-muted-foreground">
          Select a conversation from the sidebar, or click{" "}
          <span className="font-medium">New Chat</span> to start a new one.
        </p>
      </div>
    </div>
  )
}
