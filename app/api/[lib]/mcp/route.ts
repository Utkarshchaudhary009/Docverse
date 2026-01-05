import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/lib/gateway";

export const runtime = "edge"; // Or "nodejs" depending on preference, "edge" preferred for Gateway

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ lib: string }> } // Standard Next.js params
) {
    // 1. Gateway Validation
    const validation = await validateRequest(req);

    if (!validation.valid) {
        if (validation.track) {
            // Async logging without blocking response
            // context.waitUntil is available in Edge runtime
            (context as any).waitUntil(validation.track());
        }
        return NextResponse.json(
            { error: validation.error },
            { status: validation.status }
        );
    }

    // 2. Core Logic (Placeholder)
    // Logic from requirements: "Implement the Gateway... Verify user_A... consumes quota"
    // The actual "MCP" logic (RAG, vector search, etc.) goes here.
    // For this task, we return a success response to verify the gateway.

    const response = NextResponse.json({
        message: "MCP Request Processed",
        user: validation.userId,
        tier: validation.tier,
        remaining: validation.remaining
    });

    // 3. Async Logging (Success)
    if (validation.track) {
        (context as any).waitUntil(validation.track());
    }

    return response;
}
