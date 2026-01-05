import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Sync User from Clerk Webhook (Internal)
 * Handles Create, Update, and Delete idempotently.
 */
export const syncUser = internalMutation({
    args: {
        clerk_id: v.string(),
        email: v.string(),
        full_name: v.optional(v.string()),
        avatar_url: v.optional(v.string()),
        event_type: v.string(), // "user.created", "user.updated", "user.deleted"
    },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerk_id", args.clerk_id))
            .unique();

        // 1. DELETE
        if (args.event_type === "user.deleted") {
            if (existingUser) {
                // Cascade delete keys using the Clerk ID
                const keys = await ctx.db
                    .query("api_keys")
                    .withIndex("by_user", (q) => q.eq("user_id", args.clerk_id))
                    .collect();
                for (const key of keys) {
                    await ctx.db.delete(key._id);
                }

                await ctx.db.delete(existingUser._id);
            }
            return;
        }

        // 2. UPDATE
        if (existingUser) {
            await ctx.db.patch(existingUser._id, {
                email: args.email,
                full_name: args.full_name || existingUser.full_name || "", // Fallback to empty string if undefined
                avatar_url: args.avatar_url || existingUser.avatar_url || "",
                updated_at: new Date().toISOString(),
                // Role is preserved, not updated from webhook unless specified logic exists
            });
            return;
        }

        // 3. CREATE
        if (args.event_type === "user.created" || args.event_type === "user.updated") {
            // Handle "user.updated" as create if user doesn't exist (robustness)
            await ctx.db.insert("users", {
                clerk_id: args.clerk_id,
                email: args.email,
                full_name: args.full_name || "",
                avatar_url: args.avatar_url || "",
                tier: "free",
                role: args.email === "utkarshchaudhary426@gmail.com" ? "admin" : "user",
                monthly_request_limit: 100, // Default limit
                monthly_requests_used: 0,
                daily_requests_limit: 100,
                daily_requests_used: 0,
                status: "active",
                subscription_id: "", // Initialize empty
                reset_date: new Date().toISOString(), // Initialize
                email_alerts_enabled: true, // Default
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
        }
    },
});

/**
 * Get User by Clerk ID (Frontend Access)
 */
export const getUser = query({
    args: { userId: v.string() }, // Accepts Clerk ID
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerk_id", args.userId))
            .unique();
    }
});


/**
 * Tiny Increment usage mutation
 */
export const incrementUsage = mutation({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerk_id", args.userId))
            .unique();

        if (user) {
            await ctx.db.patch(user._id, {
                monthly_requests_used: (user.monthly_requests_used || 0) + 1,
                daily_requests_used: (user.daily_requests_used || 0) + 1,
            });
        }
    }
});
