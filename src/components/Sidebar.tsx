import { useState } from "react"
import { Link, useNavigate, useParams } from "@tanstack/react-router"
import { useLiveQuery } from "@tanstack/react-db"
import { MessageSquarePlus, Settings as SettingsIcon, Trash2, Pencil, Check, X } from "lucide-react"
import { conversationsCollection } from "@/db/collections/conversations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { SettingsDialog } from "./Settings"

export function Sidebar() {
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  const params = useParams({ strict: false }) as { conversationId?: string }
  const activeId = params.conversationId

  const { data: items = [] } = useLiveQuery((q) =>
    q
      .from({ conv: conversationsCollection })
      .orderBy(({ conv }) => conv.updated_at, "desc"),
  )

  const handleNew = () => {
    const id = crypto.randomUUID()
    const stream_id = crypto.randomUUID()
    conversationsCollection.insert({
      id,
      title: "New Chat",
      stream_id,
      created_at: new Date(),
      updated_at: new Date(),
    })
    navigate({ to: "/chat/$conversationId", params: { conversationId: id } })
  }

  const handleDelete = (id: string) => {
    if (!confirm("Delete this conversation?")) return
    conversationsCollection.delete(id)
    if (activeId === id) navigate({ to: "/" })
  }

  const beginRename = (id: string, current: string) => {
    setEditingId(id)
    setEditTitle(current)
  }

  const commitRename = (id: string) => {
    const title = editTitle.trim() || "Untitled"
    conversationsCollection.update(id, (draft) => {
      draft.title = title
      draft.updated_at = new Date()
    })
    setEditingId(null)
  }

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="p-3">
        <Button className="w-full justify-start gap-2" onClick={handleNew}>
          <MessageSquarePlus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {items.length === 0 ? (
          <p className="p-4 text-center text-xs text-muted-foreground">
            No conversations yet.
          </p>
        ) : (
          <ul className="space-y-1">
            {items.map((c) => {
              const isActive = c.id === activeId
              const isEditing = c.id === editingId
              return (
                <li key={c.id}>
                  {isEditing ? (
                    <div className="flex items-center gap-1 px-2 py-1">
                      <Input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename(c.id)
                          if (e.key === "Escape") setEditingId(null)
                        }}
                        className="h-7 text-sm"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => commitRename(c.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                        isActive && "bg-accent",
                      )}
                    >
                      <Link
                        to="/chat/$conversationId"
                        params={{ conversationId: c.id }}
                        className="min-w-0 flex-1 truncate"
                        title={c.title}
                      >
                        {c.title}
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          beginRename(c.id, c.title)
                        }}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Rename"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(c.id)
                        }}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => setSettingsOpen(true)}
        >
          <SettingsIcon className="h-4 w-4" />
          Settings
        </Button>
      </div>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </aside>
  )
}
