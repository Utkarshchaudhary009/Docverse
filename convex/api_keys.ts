import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "@/convex/_generated/dataModel";

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
            user_id: args.userId as Id<"users">,
            key_hash: keyHash,
            key_prefix: keyPrefix,
            key_name: args.name,
            is_active: true,
            daily_limit: limit,
            requests_today: 0,
            last_reset_at: new Date().toISOString(),
            expires_at: "", // No expiry by default
            last_used_at: "", // Initialize as empty string (never used)
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
            last_used_at: "", // Initialize as empty string
        });

        return { newKeyId, rawKey };
    }
});
export const validate = query({
    args: { apiKey: v.string() },
    handler: async (ctx, args) => {
        const submittedHash = await hashKey(args.apiKey);

        const keyRecord = await ctx.db.query("api_keys")
            .filter(q => q.eq(q.field("key_hash"), submittedHash))
            .first();

        if (!keyRecord || !keyRecord.is_active) return { valid: false };

        if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
            return { valid: false, error: "Expired" };
        }

        // Fetch the user using the properly typed ID
        const user = await ctx.db.get(keyRecord.user_id); 
        if (!user) return { valid: false };

        // CORRECT USAGE:
        // user.tier -> Correct (Property on users)
        // keyRecord.daily_limit -> Correct (Property on api_keys)
        // keyRecord.requests_today -> Correct (Property on api_keys)
        // user.monthly_requests_used -> If you need this, access it on 'user'

        return {
            valid: true,
            keyId: keyRecord._id,
            userId: user._id,
            tier: user.tier, // Access tier on USER object
            remaining: keyRecord.daily_limit - keyRecord.requests_today // Access usage on KEY object
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