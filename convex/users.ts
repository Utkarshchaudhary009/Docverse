import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// 1. Get User by ID (Strictly typed)
export const getUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    }
});

// 2. Get User by Email
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

// ✅ ADDED THIS MUTATION
export const syncUser = mutation({
    args: {
        clerk_id: v.string(),
        email: v.optional(v.string()),
        full_name: v.optional(v.string()),
        avatar_url: v.optional(v.string()),
        event_type: v.string(), // "user.created" | "user.updated" | "user.deleted"
    },
    handler: async (ctx, args) => {
        const { clerk_id, email, full_name, avatar_url, event_type } = args;

        // Note: Ideally, you should index by clerk_id. 
        // Failing that, we look up by email.
        const existingUser = clerk_id
            ? await ctx.db.query("users")
                .filter((q) => q.eq(q.field("clerk_id"), clerk_id))
                .first()
            : email
                ? await ctx.db.query("users")
                    .withIndex("by_email", (q) => q.eq("email", email))
                    .first()
                : null;

        if (event_type === "user.deleted") {
            if (existingUser) {
                await ctx.db.delete(existingUser._id);
            }
            return;
        }

        if (existingUser) {
            // Update existing user
            await ctx.db.patch(existingUser._id, {
                full_name: full_name ?? existingUser.full_name,
                avatar_url: avatar_url ?? existingUser.avatar_url,
                clerk_id: clerk_id // Uncomment if you added clerk_id to your schema
            });
        } else if (email) {
            // Create new user
            await ctx.db.insert("users", {
                email,
                full_name: full_name || "Anonymous",
                avatar_url: avatar_url || "",
                tier: "free",
                status: "active",
                subscription_id: "",
                monthly_request_limit: 100,
                monthly_requests_used: 0,
                daily_requests_limit: 100,
                daily_requests_used: 0,
                reset_date: new Date().toISOString(),
                email_alerts_enabled: true,
                clerk_id: clerk_id // Uncomment if you added clerk_id to your schema
            });
        }
    }
});
export const incrementUsage = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    
    await ctx.db.patch(args.userId, {
      monthly_requests_used: (user.monthly_requests_used || 0) + 1,
      daily_requests_used: (user.daily_requests_used || 0) + 1,
    });
    
  },
});