"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode, useEffect } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function AuthSync() {
    const { isAuthenticated } = useConvexAuth();
    const storeUser = useMutation(api.users.store);

    useEffect(() => {
        if (isAuthenticated) {
            // Sync user to Convex on every login/mount
            storeUser({});
        }
    }, [isAuthenticated, storeUser]);

    return null;
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
    return (
        <ClerkProvider>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                <AuthSync />
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}
