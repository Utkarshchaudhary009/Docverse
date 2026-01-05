import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    full_name: v.string(),
    avatar_url: v.string(),
    tier: v.string(),
    status: v.string(), // or v.number() depending on your logic preference, but string is fine for "active"/"inactive"
    subscription_id: v.string(),
    monthly_request_limit: v.number(),
    monthly_requests_used: v.number(),
    daily_requests_limit: v.number(),
    reset_date: v.string(),
    email_alerts_enabled: v.boolean(),
  }).index("by_email", ["email"]),

  api_keys: defineTable({
    user_id: v.string(),
    key_hash: v.string(),
    key_prefix: v.string(),
    key_name: v.string(),
    is_active: v.boolean(),
    daily_limit: v.number(),
    requests_today: v.number(),
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
    status: v.number(), // Make sure this matches your logs.ts (number for status codes like 200, 429)
    endpoint: v.string(),
    duration: v.number(),
    ip: v.string(),
  })
  .index("by_user", ["user_id"])
  .index("by_timestamp", ["timestamp"]),
});