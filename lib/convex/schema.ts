import { defineSchema, defineTable } from "convex/schema";

export default defineSchema({
  users: defineTable({
    email: "string",
    full_name: "string",
    avatar_url: "string",
    tier: "string",
    status: "string",
    subscription_id: "string",
    monthly_request_limit: "number",
    monthly_requests_used: "number",
    reset_date: "string",
    email_alerts_enabled: "boolean",
  }).index("by_email", ["email"]),

  api_keys: defineTable({
    user_id: "string",
    key_hash: "string",
    key_prefix: "string",
    key_name: "string",
    is_active: "boolean",
    daily_limit: "number",
    requests_today: "number",
    last_reset_at: "string",
    expires_at: "string",
    last_used_at: "string",
  }).index("by_user", ["user_id"]),
});
