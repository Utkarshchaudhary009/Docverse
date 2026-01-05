import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerk_id: v.string(),
    email: v.string(),
    full_name: v.string(),
    avatar_url: v.string(),
    tier: v.string(),
    status: v.string(),
    subscription_id: v.string(),
    monthly_request_limit: v.number(),
    monthly_requests_used: v.number(), // This is on users
    daily_requests_limit: v.number(),
    daily_requests_used: v.number(), // ✅ ADDED THIS FIELD
    reset_date: v.string(),
    email_alerts_enabled: v.boolean(),
  }).index("by_email", ["email"])
  .index("by_clerk_id", ["clerk_id"]), // INDEX FOR CLERK ID LOOKUPS

  api_keys: defineTable({
    user_id: v.id("users"), // CHANGE: Strongly typed ID reference
    key_hash: v.string(),
    key_prefix: v.string(),
    key_name: v.string(),
    is_active: v.boolean(),
    daily_limit: v.number(),
    requests_today: v.number(), // This is on api_keys
    last_reset_at: v.string(),
    expires_at: v.string(),
    last_used_at: v.string(),
  })
  .index("by_user", ["user_id"])
  .index("by_key_hash", ["key_hash"]),

  request_logs: defineTable({
    request_id: v.string(),
    user_id: v.string(),
    key_id: v.string(),
    timestamp: v.number(),
    status: v.number(),
    endpoint: v.string(),
    duration: v.number(),
    ip: v.string(),
  })
  .index("by_user", ["user_id"])
  .index("by_timestamp", ["timestamp"]),
});