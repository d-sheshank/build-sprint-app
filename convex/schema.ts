import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  aiCallLimits: defineTable({
    scope: v.literal("app"),
    calls: v.array(v.number()),
  }).index("by_scope", ["scope"]),
});
