import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 1. Get User by ID (Strictly typed)
export const getUser = query({
    args: { userId: v.id("users") }, // CHANGED: Enforce ID format
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    }
});

// 2. Get User by Email (Alternative if you don't have the ID yet)
export const getUserByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db.query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();
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
    }
});