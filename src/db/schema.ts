import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const conversations = pgTable("conversations", {
  id: uuid().primaryKey().defaultRandom(),
  title: text().notNull().default("New Chat"),
  stream_id: text().notNull().unique(),
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
})
