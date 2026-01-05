import { EventSchemas, Inngest } from "inngest";

type Events = {
    "identity/user.synced": {
        data: {
            clerk_id: string;
            email?: string;
            full_name?: string;
            avatar_url?: string;
            event_type: "user.created" | "user.updated" | "user.deleted";
        }
    };
    "analytics/request.logged": {
        data: {
            requestId: string;
            userId: string;
            status: number;
            endpoint: string;
            duration: number;
            ip: string;
        }
    };
};

export const inngest = new Inngest({ id: "docverse-app", schemas: new EventSchemas().fromRecord<Events>() });