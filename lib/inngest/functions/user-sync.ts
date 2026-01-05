import { inngest } from "../client";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export const syncUserToConvex = inngest.createFunction(
    { id: "sync-user-to-convex" },
    { event: "identity/user.synced" },
    async ({ event, step }) => {
        await step.run("sync-user", async () => {
            await fetchMutation(api.users.syncUser, {
                clerk_id: event.data.clerk_id,
                email: event.data.email || "",
                full_name: event.data.full_name || "",
                avatar_url: event.data.avatar_url || "",
                event_type: event.data.event_type,
            });
        });
    }
);
