import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Defining limits per tier
const LIMITS = {
  free: 100,
  developer: 1000,
  pro: 10000
};

export async function validateRequest(req: Request) {
  // 1. Session-Based Auth (No DB Query)
  const { userId, sessionClaims } = await auth();

  if (!userId || !sessionClaims) {
    return { valid: false, status: 401, error: "Unauthorized" };
  }

  // 2. Extract Metadata from Session Token
  // This allows zero-latency tier checks
  const tier = sessionClaims.metadata?.tier || "free";
  const limit = LIMITS[tier];

  // 3. Rate Limit using Clerk User ID
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, "1 d"),
    analytics: true,
    prefix: "ratelimit",
  });

  const { success, remaining } = await ratelimit.limit(userId);

  if (!success) {
    // Async Log Failure
    // Using context.waitUntil pattern if available in calling route, 
    // or just fire-and-forget promise here (less reliable on edge but simple for now)
    await convex.mutation(api.logs.log, {
      requestId: crypto.randomUUID(),
      userId,
      keyId: "session",
      timestamp: Date.now(),
      status: 429,
      endpoint: new URL(req.url).pathname,
      duration: 0,
      ip: "session-ip"
    });

    return { valid: false, status: 429, error: "Rate Limit Exceeded" };
  }

  // 4. Success Tracker
  const track = async () => {
    await convex.mutation(api.logs.log, {
      requestId: crypto.randomUUID(),
      userId,
      keyId: "session",
      timestamp: Date.now(),
      status: 200,
      endpoint: new URL(req.url).pathname,
      duration: 0,
      ip: "session-ip"
    });
  };

  return {
    valid: true,
    status: 200,
    userId,
    tier,
    remaining,
    track
  };
}
