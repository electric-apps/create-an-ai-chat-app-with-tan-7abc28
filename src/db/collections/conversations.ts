import { createCollection } from "@tanstack/react-db"
import { electricCollectionOptions } from "@tanstack/electric-db-collection"
import { absoluteApiUrl } from "@/lib/client-url"
import { conversationSelectSchema } from "@/db/zod-schemas"

export const conversationsCollection = createCollection(
  electricCollectionOptions({
    id: "conversations",
    schema: conversationSelectSchema,
    getKey: (row) => row.id,
    shapeOptions: {
      url: absoluteApiUrl("/api/conversations"),
      parser: {
        timestamptz: (date: string) => new Date(date),
      },
    },
    onInsert: async ({ transaction }) => {
      const { modified } = transaction.mutations[0]
      const res = await fetch("/api/conversations/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modified),
      })
      if (!res.ok) throw new Error(`Insert failed: ${res.status}`)
      return { txid: (await res.json()).txid }
    },
    onUpdate: async ({ transaction }) => {
      const { modified } = transaction.mutations[0]
      const res = await fetch(`/api/conversations/mutate?id=${modified.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modified),
      })
      if (!res.ok) throw new Error(`Update failed: ${res.status}`)
      return { txid: (await res.json()).txid }
    },
    onDelete: async ({ transaction }) => {
      const { original } = transaction.mutations[0]
      const res = await fetch(`/api/conversations/mutate?id=${original.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
      return { txid: (await res.json()).txid }
    },
  }),
)
