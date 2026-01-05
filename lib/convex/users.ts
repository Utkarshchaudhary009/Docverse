import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Syncs the current Clerk user to Convex.
 * Create if new, Update if existing.
 * Returns the full User object (so frontend gets latest Tier immediately).
 */
export const store = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called store without authentication present");
        }

        // Check if user exists
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
            .unique();

        if (user !== null) {
            // Update existing
            // Logic: Update name/email if changed, keep Tier/Role same.
            if (user.full_name !== identity.name || user.email !== identity.email) {
                await ctx.db.patch(user._id, {
                    full_name: identity.name!,
                    email: identity.email!,
                });
            }
            return user;
        }

        // Create New
        const newUserId = await ctx.db.insert("users", {
            tokenIdentifier: identity.tokenIdentifier,
            clerk_id: identity.subject, // Map subject to clerk_id for consistency if possible, or leave empty if relying on webhook
            full_name: identity.name!,
            email: identity.email!,
            avatar_url: identity.pictureUrl || "",
            tier: "free", // Default
            role: "user", // Default
            status: "active",
            subscription_id: "",
            monthly_request_limit: 100, // Monthly placeholder
            monthly_requests_used: 0,
            daily_requests_limit: 100,
            reset_date: new Date().toISOString(),
            email_alerts_enabled: true,
        });

        return await ctx.db.get(newUserId);
    },
});

export const updateTier = mutation({
    args: {
        userId: v.id("users"),
        tier: v.union(v.literal("free"), v.literal("pro"), v.literal("developer"))
    },
    handler: async (ctx, args) => {
        // Admin check should be here ideally, but for now trusting the mutation call site or admin portal protection.

        let limit = 100;
        if (args.tier === "developer") limit = 1000;
        if (args.tier === "pro") limit = 10000;

        await ctx.db.patch(args.userId, {
            tier: args.tier,
            daily_requests_limit: limit
        });

        // Sync API keys limits
        const keys = await ctx.db.query("api_keys")
            .filter(q => q.eq(q.field("user_id"), args.userId)) // Assuming userId is Convex ID
            .collect();

        for (const key of keys) {
            await ctx.db.patch(key._id, { daily_limit: limit });
        }
    }
});

export const syncUser = internalMutation({
    args: {
        clerk_id: v.string(),
        email: v.optional(v.string()),
        full_name: v.optional(v.string()),
        avatar_url: v.optional(v.string()),
        event_type: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. Check Existence by Clerk ID
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerk_id", args.clerk_id))
            .unique();

        // 2. Handle DELETE (Hard Delete)
        if (args.event_type === "user.deleted") {
            if (user) {
                await ctx.db.delete(user._id);
                const keys = await ctx.db.query("api_keys")
                    .withIndex("by_user", q => q.eq("user_id", user._id))
                    .collect();
                for (const k of keys) await ctx.db.delete(k._id);
            }
            return;
        }

        // 3. Handle CREATE / UPDATE
        if (user) {
            await ctx.db.patch(user._id, {
                full_name: args.full_name || user.full_name,
                email: args.email || user.email,
                avatar_url: args.avatar_url || user.avatar_url,
            });
            return;
        }

        await ctx.db.insert("users", {
            clerk_id: args.clerk_id,
            tokenIdentifier: args.clerk_id,
            email: args.email!,
            full_name: args.full_name!,
            avatar_url: args.avatar_url || "",
            tier: "free",
            role: "user",
            status: "active",
            subscription_id: "",
            monthly_request_limit: 100,
            monthly_requests_used: 0,
            daily_requests_limit: 100,
            reset_date: new Date().toISOString(),
            email_alerts_enabled: true,
        });
    },
});

export const incrementUsage = mutation({
    args: { userId: v.string() }, // Accept string for Clerk ID
    handler: async (ctx, args) => {
        // Attempt lookup by Clerk ID
        const userByClerk = await ctx.db.query("users")
            .withIndex("by_clerk_id", q => q.eq("clerk_id", args.userId))
            .unique();

        // Attempt lookup by ID if string looks like an ID (optional but safe)
        let user = userByClerk;
        if (!user) {
            try {
                user = await ctx.db.get(args.userId as any);
            } catch (e) { /* ignore cast error */ }
        }

        if (user) {
            await ctx.db.patch(user._id, {
                monthly_requests_used: (user.monthly_requests_used || 0) + 1
            });
        }
    }
});
