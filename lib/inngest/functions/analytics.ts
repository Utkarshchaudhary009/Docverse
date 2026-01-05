import { inngest } from "../client";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const trackApiUsage = inngest.createFunction(
    { id: "track-api-usage" },
    { event: "analytics/request.logged" },
    async ({ event, step }) => {
        // 1. Log the Raw Request
        await step.run("log-to-db", async () => {
            await fetchMutation(api.logs.log, {
                requestId: event.data.requestId,
                userId: event.data.userId,
                keyId: "session", // or event.data.keyId if we pass it
                timestamp: Date.now(),
                status: event.data.status,
                endpoint: event.data.endpoint,
                duration: event.data.duration,
                ip: event.data.ip,
            });
        });

        // 2. Increment Usage Counter
        await step.run("update-usage-counter", async () => {
            await fetchMutation(api.users.incrementUsage, {
                userId: event.data.userId as Id<"users">,
            });
        });
    }
);
