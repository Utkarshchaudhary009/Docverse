import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Environment validation
const requiredEnvVars = {
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error(`❌ Missing environment variables: ${missingVars.join(', ')}`);
  throw new Error(
    `Gateway configuration error: Missing ${missingVars.join(', ')}. ` +
    'Please add these to your environment variables.'
  );
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Rate Limiter configuration
const ratelimit = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 d"),
    analytics: true,
    prefix: "ratelimit:free",
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10000, "1 d"),
    analytics: true,
    prefix: "ratelimit:pro",
  }),
};

interface ValidationResult {
  valid: boolean;
  status: number;
  error?: string;
  userId?: string;
  keyId?: string;
  tier?: string;
  remaining?: number;
  track?: () => Promise<void>;
}

export async function validateRequest(req: Request): Promise<ValidationResult> {
  const apiKey = req.headers.get("x-api-key");
  const endpoint = new URL(req.url).pathname;
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  if (!apiKey) {
    return { valid: false, status: 401, error: "Missing API Key" };
  }

  const startTime = Date.now();

  // 1. Identify: Check Cache (Upstash) -> Fallback to Convex
  // Cache key: we rely on the raw key here.
  // Ideally we cache hash->metadata, but client sends raw.
  // So we cache `apikey:{rawKey} -> metadata`.

  const cacheKey = `apikey:${apiKey}`;

  // Try Cache
  let userMeta = await redis.get(cacheKey) as { userId: string; tier: string; keyId: string; valid: boolean } | null;

  if (!userMeta) {
    // Fallback: Validate via Convex (Secure Module)
    // We send the RAW key, Convex hashes it and checks DB.
    const result: any = await convex.query(api.api_keys.validate, { apiKey });

    if (!result || !result.valid) {
      // Cache negative result briefly to avoid spamming DB? 
      // Required for security against brute force.
      return { valid: false, status: 401, error: "Invalid API Key" };
    }

    userMeta = {
      userId: result.userId,
      tier: result.tier,
      keyId: result.keyId,
      valid: true
    };

    // Cache success for 60s
    await redis.set(cacheKey, userMeta, { ex: 60 });
  }

  if (!userMeta || !userMeta.valid) {
    return { valid: false, status: 401, error: "Invalid API Key" };
  }

  const { userId, tier, keyId } = userMeta;

  // 2. Rate Limit
  const limitKey = `limit:${userId}`;
  const limiter = (tier === "pro") ? ratelimit.pro : ratelimit.free;
  const { success, remaining } = await limiter.limit(limitKey);

  if (!success) {
    return {
      valid: false,
      status: 429,
      error: "Rate Limit Exceeded",
      userId,
      keyId,
      track: async () => {
        await convex.mutation(api.logs.log, {
          requestId: crypto.randomUUID(),
          userId,
          keyId,
          timestamp: Date.now(),
          status: 429,
          endpoint,
          duration: Date.now() - startTime,
          ip
        });
      }
    };
  }

  // 3. Success
  return {
    valid: true,
    status: 200,
    userId,
    keyId,
    tier,
    remaining,
    track: async () => {
      await convex.mutation(api.logs.log, {
        requestId: crypto.randomUUID(),
        userId,
        keyId,
        timestamp: Date.now(),
        status: 200,
        endpoint,
        duration: Date.now() - startTime,
        ip
      });
    }
  };
}
