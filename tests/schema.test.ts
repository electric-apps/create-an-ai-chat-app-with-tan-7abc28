import { describe, expect, it } from "vitest"
import {
  conversationSelectSchema,
  conversationInsertSchema,
} from "@/db/zod-schemas"
import {
  generateRowWithout,
  generateValidRow,
  parseDates,
} from "./helpers/schema-test-utils"

describe("conversation select schema", () => {
  it("accepts a complete row", () => {
    const row = generateValidRow(conversationSelectSchema)
    expect(conversationSelectSchema.safeParse(row).success).toBe(true)
  })

  it("rejects row missing stream_id", () => {
    const row = generateRowWithout(conversationSelectSchema, "stream_id")
    expect(conversationSelectSchema.safeParse(row).success).toBe(false)
  })

  it("round-trips through JSON.stringify + parseDates", () => {
    const row = generateValidRow(conversationSelectSchema)
    const roundTripped = parseDates(JSON.parse(JSON.stringify(row)))
    expect(conversationSelectSchema.safeParse(roundTripped).success).toBe(true)
  })
})

describe("conversation insert schema", () => {
  it("accepts a new conversation payload", () => {
    const row = generateValidRow(conversationInsertSchema)
    expect(conversationInsertSchema.safeParse(row).success).toBe(true)
  })
})
