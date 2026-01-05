import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Log a request to the database
// This is the High-Volume Write function.
export const log = mutation({
    args: {
        requestId: v.string(),
        userId: v.string(), // Clerk ID
        keyId: v.string(),  // Convex ID of the key (as string from client)
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
        const user = await ctx.db.query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerk_id", args.userId))
            .unique();

        if (user) {
            await ctx.db.patch(user._id, {
                monthly_requests_used: (user.monthly_requests_used || 0) + 1
            });
        }

        // Increment Key Specific Counters
        // args.keyId is passed as string, we assume it's the valid ID for api_keys
        // We cast it to Id<"api_keys"> to use in get/patch
        const keyId = args.keyId as Id<"api_keys">;
        const key = await ctx.db.get(keyId);

        if (key) {
            await ctx.db.patch(keyId, {
                requests_today: (key.requests_today || 0) + 1,
                last_used_at: new Date().toISOString()
            });
        }
    },
});

export const getRecentLogs = query({
    args: {
        userId: v.string(), // Clerk ID
        limit: v.number()
    },
    handler: async (ctx, args) => {
        return await ctx.db.query("request_logs")
            .withIndex("by_user", (q) => q.eq("user_id", args.userId))
            .order("desc") // timestamp
            .take(args.limit);
    }
});
