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
    monthly_requests_used: v.number(),
    daily_requests_limit: v.number(),
    daily_requests_used: v.number(),
    reset_date: v.string(),
    email_alerts_enabled: v.boolean(),
    role: v.optional(v.string()), // Added role to match users.ts logic
    created_at: v.optional(v.string()), // Added timestamps
    updated_at: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_clerk_id", ["clerk_id"]), // Primary lookup index

  api_keys: defineTable({
    user_id: v.string(), // Changed from v.id("users") to v.string() (Clerk ID)
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
    .index("by_user", ["user_id"]) // Index on Clerk ID
    .index("by_key_hash", ["key_hash"]),

  request_logs: defineTable({
    request_id: v.string(),
    user_id: v.string(), // Ensure this is also Clerk ID
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