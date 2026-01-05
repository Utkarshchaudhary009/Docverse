import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
    // Protect all Admin routes
    if (isAdminRoute(req)) {
        const { sessionClaims } = await auth();

        // Strict RBAC Check using Custom Claims
        if (sessionClaims?.metadata?.role !== 'admin') {
            const url = new URL('/dashboard', req.url);
            return NextResponse.redirect(url);
        }
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes, excluding webhooks
        '/(api(?!/webhooks)|trpc)(.*)',
    ],
};
