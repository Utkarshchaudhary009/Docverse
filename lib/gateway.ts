import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { auth } from "@clerk/nextjs/server";
import { inngest } from "@/lib/inngest/client";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const LIMITS = {
  free: 100,
  developer: 1000,
  pro: 10000
};

export async function validateRequest(req: Request) {
  const { userId, sessionClaims } = await auth();

  if (!userId || !sessionClaims) {
    return { valid: false, status: 401, error: "Unauthorized" };
  }

  const tier = sessionClaims.metadata?.tier || "free";
  const limit = LIMITS[tier];

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, "1 d"),
    analytics: true,
    prefix: "ratelimit",
  });

  const { success, remaining } = await ratelimit.limit(userId);

  if (!success) {
    // Log Failure via Inngest
    await inngest.send({
      name: "analytics/request.logged",
      data: {
        requestId: crypto.randomUUID(),
        userId,
        status: 429,
        endpoint: new URL(req.url).pathname,
        duration: 0,
        ip: "session-ip"
      }
    });

    return { valid: false, status: 429, error: "Rate Limit Exceeded" };
  }

  // Success Tracker via Inngest
  const track = async () => {
    await inngest.send({
      name: "analytics/request.logged",
      data: {
        requestId: crypto.randomUUID(),
        userId,
        status: 200,
        endpoint: new URL(req.url).pathname,
        duration: 0,
        ip: "session-ip"
      }
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
