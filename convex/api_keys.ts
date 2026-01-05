import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Generates a secure random API key standard.
 * Format: sk_{env}_{random_32_chars}
 */
function generateKeyString(env: "live" | "test" = "live"): string {
    const bytes = new Uint8Array(24); // 24 bytes = ~32 chars base64
    crypto.getRandomValues(bytes);
    const randomPart = btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, "").replace(/\//g, "").replace(/=+$/, ""); // URL safe-ish
    return `sk_${env}_${randomPart}`;
}

/**
 * Computes SHA-256 hash of the key.
 */
async function hashKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ------------------------------------------------------------
// MUTATIONS
// ------------------------------------------------------------

export const create = mutation({
    args: {
        userId: v.string(), // In real app, infer from context.auth
        name: v.string(),
        tier: v.union(v.literal("free"), v.literal("pro")),
    },
    handler: async (ctx, args) => {
        const rawKey = generateKeyString("live");
        const keyHash = await hashKey(rawKey);
        const keyPrefix = rawKey.substring(0, 10); // "sk_live_12"

        const limit = args.tier === "pro" ? 10000 : 100;

        const keyId = await ctx.db.insert("api_keys", {
            user_id: args.userId,
            key_hash: keyHash,
            key_prefix: keyPrefix,
            key_name: args.name,
            is_active: true,
            daily_limit: limit,
            requests_today: 0,
            last_reset_at: new Date().toISOString(),
            expires_at: "", // No expiry by default
        });

        // RETURN RAW KEY ONLY ONCE
        return { keyId, rawKey };
    },
});

export const revoke = mutation({
    args: { keyId: v.id("api_keys") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.keyId, { is_active: false });
    },
});

export const deleteKey = mutation({
    args: { keyId: v.id("api_keys") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.keyId);
    }
});

export const rotate = mutation({
    args: { keyId: v.id("api_keys") },
    handler: async (ctx, args) => {
        const oldKey = await ctx.db.get(args.keyId);
        if (!oldKey) throw new Error("Key not found");

        // Revoke old
        await ctx.db.patch(args.keyId, { is_active: false });

        // Generate new with same settings
        const rawKey = generateKeyString("live");
        const keyHash = await hashKey(rawKey);
        const keyPrefix = rawKey.substring(0, 10);

        const newKeyId = await ctx.db.insert("api_keys", {
            user_id: oldKey.user_id,
            key_hash: keyHash,
            key_prefix: keyPrefix,
            key_name: `${oldKey.key_name} (Rotated)`,
            is_active: true,
            daily_limit: oldKey.daily_limit,
            requests_today: 0,
            last_reset_at: new Date().toISOString(),
            expires_at: oldKey.expires_at,
        });

        return { newKeyId, rawKey };
    }
});

// ------------------------------------------------------------
// QUERIES
// ------------------------------------------------------------

export const validate = query({
    args: { apiKey: v.string() }, // The RAW key from client
    handler: async (ctx, args) => {
        // 1. Identify candidates by prefix (Optimization)
        // Since we can't search by hash directly (client sends raw), 
        // we can filter valid keys by prefix if we stored it, or scan all active keys for the user?
        // Wait, client sends raw key. We HASH it, then look up by hash.

        const submittedHash = await hashKey(args.apiKey);

        // Lookup by key_hash (indexed)
        // Note: You need to add .index("by_key_hash", ["key_hash"]) to schema for this to be fast.
        // Assuming user will add it or I rely on filter (slower but works for MVP).

        const keyRecord = await ctx.db.query("api_keys")
            .filter(q => q.eq(q.field("key_hash"), submittedHash))
            .first();

        if (!keyRecord || !keyRecord.is_active) return { valid: false };

        // Check expiry
        if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
            return { valid: false, error: "Expired" };
        }

        const user = await ctx.db.get(keyRecord.user_id as any);
        if (!user) return { valid: false };

        return {
            valid: true,
            keyId: keyRecord._id,
            userId: user._id,
            tier: user.tier,
            remaining: keyRecord.daily_limit - keyRecord.requests_today // approximate
        };
    }
});

export const getExpiry = query({
    args: { keyId: v.id("api_keys") },
    handler: async (ctx, args) => {
        const key = await ctx.db.get(args.keyId);
        return key?.expires_at || null;
    }
});
