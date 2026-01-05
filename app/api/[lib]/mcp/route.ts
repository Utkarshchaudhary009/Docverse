import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/gateway";
import { getContextFromQuery } from "@/lib/pinecone/query-rag";

export const runtime = "edge";

interface MCPMessage {
    role: string;
    content: string;
}

interface MCPRequestBody {
    messages?: MCPMessage[];
    query?: string;
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ lib: string }> }
) {
    // 1. Gateway Validation (MUST be first)
    const validation = await validateRequest(req);

    if (!validation.valid) {
        if (validation.track) {
            (context as any).waitUntil(validation.track());
        }
        return NextResponse.json(
            { error: validation.error },
            { status: validation.status }
        );
    }

    // 2. Extract query from request body
    let query: string;
    try {
        const body: MCPRequestBody = await req.json();

        // Support multiple input formats
        if (body.query) {
            query = body.query;
        } else if (body.messages && body.messages.length > 0) {
            // Get the last user message
            const userMessages = body.messages.filter(m => m.role === "user");
            const lastUserMessage = userMessages[userMessages.length - 1];
            query = lastUserMessage?.content || "";
        } else {
            return NextResponse.json(
                { error: "Missing query. Provide 'query' or 'messages' array." },
                { status: 400 }
            );
        }

        if (!query.trim()) {
            return NextResponse.json(
                { error: "Query cannot be empty" },
                { status: 400 }
            );
        }
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON body" },
            { status: 400 }
        );
    }

    // 3. Get library param
    const params = await context.params;
    const library = params.lib;

    // 4. Perform RAG query
    try {
        const { context: ragContext, matches } = await getContextFromQuery(
            query,
            10,
            library
        );

        const response = NextResponse.json({
            content: ragContext,
            context: ragContext,
            matches: matches?.length || 0,
            user: validation.userId,
            tier: validation.tier,
            remaining: validation.remaining,
        });

        // 5. Async Logging (Success)
        if (validation.track) {
            (context as any).waitUntil(validation.track());
        }

        return response;
    } catch (error) {
        console.error("RAG query error:", error);

        // Log the failure
        if (validation.track) {
            (context as any).waitUntil(validation.track());
        }

        return NextResponse.json(
            { error: "Failed to process query" },
            { status: 500 }
        );
    }
}
