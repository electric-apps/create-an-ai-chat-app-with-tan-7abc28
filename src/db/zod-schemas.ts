import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod/v4"
import { conversations } from "./schema"

export const conversationSelectSchema = createSelectSchema(conversations, {
  created_at: z.coerce.date().default(() => new Date()),
  updated_at: z.coerce.date().default(() => new Date()),
})

export const conversationInsertSchema = createInsertSchema(conversations, {
  created_at: z.coerce.date().default(() => new Date()),
  updated_at: z.coerce.date().default(() => new Date()),
})

export type Conversation = z.infer<typeof conversationSelectSchema>
export type NewConversation = z.infer<typeof conversationInsertSchema>
