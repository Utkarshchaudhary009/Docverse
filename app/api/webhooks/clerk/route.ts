import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { inngest } from "@/lib/inngest/client";

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error("Please add CLERK_WEBHOOK_SECRET to .env.local");
    }

    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response("Error occurred -- no svix headers", { status: 400 });
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: WebhookEvent;

    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error("Error verifying webhook:", err);
        return new Response("Error occurred", { status: 400 });
    }

    const { id } = evt.data;
    const eventType = evt.type;

    if (!id) {
        return new Response("Error occurred -- no id", { status: 400 });
    }

    // Fire and Forget via Inngest
    await inngest.send({
        name: "identity/user.synced",
        data: {
            clerk_id: id,
            email: (evt.data as any).email_addresses?.[0]?.email_address,
            full_name: (evt.data as any).first_name + " " + (evt.data as any).last_name,
            avatar_url: (evt.data as any).image_url,
            event_type: eventType as any,
        }
    });

    return new Response("Event Queued", { status: 200 });
}
