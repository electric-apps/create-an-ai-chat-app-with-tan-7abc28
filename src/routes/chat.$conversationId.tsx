import { useEffect, useMemo, useRef, useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useLiveQuery } from "@tanstack/react-db"
import { useChat } from "@tanstack/ai-react"
import { durableStreamConnection } from "@durable-streams/tanstack-ai-transport"
import { Send } from "lucide-react"
import { toast } from "sonner"
import { conversationsCollection } from "@/db/collections/conversations"
import { useApiKey } from "@/contexts/api-key"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/chat/$conversationId")({
  ssr: false,
  component: ChatPage,
})

const MODEL = "claude-sonnet-4-5"

function ChatPage() {
  const { conversationId } = Route.useParams()
  const navigate = useNavigate()
  const { apiKey, ready } = useApiKey()

  const { data: allConversations = [] } = useLiveQuery((q) =>
    q.from({ conv: conversationsCollection }),
  )
  const conversation = allConversations.find((c) => c.id === conversationId)

  const streamId = conversation?.stream_id
  const connection = useMemo(() => {
    if (!streamId) return null
    return durableStreamConnection({
      sendUrl: `/api/chat?id=${encodeURIComponent(streamId)}`,
      readUrl: `/api/chat-stream?id=${encodeURIComponent(streamId)}`,
      headers: { "x-api-key": apiKey },
    })
  }, [streamId, apiKey])

  void ready
  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading conversation…
      </div>
    )
  }

  if (!connection) return null

  return (
    <ChatInner
      connection={connection}
      conversationTitle={conversation.title}
      streamId={streamId!}
      apiKeyPresent={!!apiKey}
      onMissingKey={() => toast.error("Add your Anthropic API key in Settings.")}
      goHomeOnDelete={() => navigate({ to: "/" })}
    />
  )
}

function ChatInner({
  connection,
  conversationTitle,
  streamId,
  apiKeyPresent,
  onMissingKey,
}: {
  connection: ReturnType<typeof durableStreamConnection>
  conversationTitle: string
  streamId: string
  apiKeyPresent: boolean
  onMissingKey: () => void
  goHomeOnDelete: () => void
}) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    id: streamId,
    connection,
    live: true,
  })

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    if (!apiKeyPresent) {
      onMissingKey()
      return
    }
    void MODEL
    setInput("")
    try {
      await sendMessage(text)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      toast.error(
        /401|unauthoriz|invalid.*api.*key/i.test(message)
          ? "Invalid Anthropic API key. Check it in Settings."
          : /429|rate.?limit/i.test(message)
            ? "Rate limited by Anthropic. Try again shortly."
            : `Chat failed: ${message}`,
      )
      setInput(text)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-border px-4 py-3">
        <h1 className="truncate text-sm font-medium">{conversationTitle}</h1>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
          {messages.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Ask Claude anything to get started.
            </p>
          ) : (
            messages.map((m) => {
              const text = (m.parts ?? [])
                .filter((p: { type: string }) => p.type === "text")
                .map((p: { content?: string }) => p.content ?? "")
                .join("")
              const isUser = m.role === "user"
              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    isUser ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-2 text-sm",
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {text || (
                      <span className="text-muted-foreground">…</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
          {status === "streaming" && (
            <p className="text-xs text-muted-foreground">Claude is typing…</p>
          )}
        </div>
      </div>

      <form
        className="border-t border-border bg-background p-3"
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={
              apiKeyPresent
                ? "Message Claude (Shift+Enter for newline)…"
                : "Add your API key in Settings to chat…"
            }
            rows={2}
            className="min-h-[44px] resize-none"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || status === "streaming"}
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
