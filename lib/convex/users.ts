import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getUser = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        // Assuming userId matches the ID in table or we search by a field
        // Schema says `users` table. 
        // If args.userId is the database ID:
        // return await ctx.db.get(args.userId as any);
        // If it's an external ID (like Clerk ID), we search.
        // Based on schema `api_keys` has `user_id: string`.
        // Let's assume we are passing the Convex ID for simplicity, or we add logic.

        // Safe bet: Try to get by ID, if fails, query? 
        // Let's assume these are Convex IDs.
        return await ctx.db.get(args.userId as any);
    }
});

export const updateTier = mutation({
    args: {
        userId: v.id("users"),
        tier: v.union(v.literal("free"), v.literal("pro"))
    },
    handler: async (ctx, args) => {
        const limit = args.tier === "pro" ? 10000 : 100;
        await ctx.db.patch(args.userId, {
            tier: args.tier,
            daily_requests_limit: limit
        });
        // Also update limits on all active keys?
        // Ideally, keys inherit user limits or have their own. 
        // Schema has `daily_limit` on Key. Let's sync them.
        const keys = await ctx.db.query("api_keys")
            .filter(q => q.eq(q.field("user_id"), args.userId))
            .collect();

        for (const key of keys) {
            await ctx.db.patch(key._id, { daily_limit: limit });
        }
    }
});

export const toggleEmailAlerts = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (user) {
            await ctx.db.patch(args.userId, {
                email_alerts_enabled: !user.email_alerts_enabled
            });
        }
    }
});

export const getLimits = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return null;

        return {
            daily_limit: user.daily_requests_limit,
            // Calculate usage from today's logs or key counters
            // We store `requests_today` on keys.
            // Aggregating all keys:
            keys_usage: "Check api_keys table for breakdown"
        };
    }
});
