import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { syncUserToConvex } from "@/lib/inngest/functions/user-sync";
import { trackApiUsage } from "@/lib/inngest/functions/analytics";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncUserToConvex,
    trackApiUsage
  ],
});
