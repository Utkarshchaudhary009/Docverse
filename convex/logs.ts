import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Log a request to the database (Moved from functions.ts)
// This is the High-Volume Write function.
export const log = mutation({
    args: {
        requestId: v.string(),
        userId: v.string(),
        keyId: v.string(),
        timestamp: v.number(),
        status: v.number(),
        endpoint: v.string(),
        duration: v.number(),
        ip: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("request_logs", {
            request_id: args.requestId,
            user_id: args.userId,
            key_id: args.keyId,
            timestamp: args.timestamp,
            status: args.status,
            endpoint: args.endpoint,
            duration: args.duration,
            ip: args.ip,
        });

        // Increment User Global Counters
        // Ideally this is batched or separate, but we'll do it here for atomic accuracy
        const user = await ctx.db.get(args.userId as any);
        if (user && "monthly_requests_used" in user) {
            await ctx.db.patch(args.userId as any, {
                monthly_requests_used: (user.monthly_requests_used || 0) + 1
            });
        }

        // Increment Key Specific Counters
        const keys = await ctx.db.query("api_keys")
            .filter((q) => q.eq(q.field("_id"), args.keyId as any))
            .first();
        if (keys) {
            await ctx.db.patch(args.keyId as any, {
                requests_today: (keys.requests_today || 0) + 1,
                last_used_at: new Date().toISOString()
            });
        }
    },
});

export const getRecentLogs = query({
    args: {
        userId: v.string(),
        limit: v.number()
    },
    handler: async (ctx, args) => {
        return await ctx.db.query("request_logs")
            .withIndex("by_user", (q) => q.eq("user_id", args.userId))
            .order("desc") // timestamp
            .take(args.limit);
    }
});
