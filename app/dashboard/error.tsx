"use client";

import { useEffect } from "react";

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Dashboard error:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8">
            <div className="max-w-2xl w-full">
                {/* Terminal Window */}
                <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden shadow-2xl">
                    {/* Terminal Header */}
                    <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800/50 border-b border-zinc-800">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="ml-4 text-zinc-500 text-sm font-mono">
                            docverse://dashboard
                        </span>
                    </div>

                    {/* Terminal Body */}
                    <div className="p-6 font-mono text-sm">
                        <div className="text-red-400 mb-4">
                            <span className="text-zinc-500">$</span> ERROR
                        </div>

                        <div className="text-zinc-300 space-y-2 mb-6">
                            <p className="text-xl text-red-400 font-bold">
                                ⚡ Connection Interrupted
                            </p>
                            <p className="text-zinc-500">
                                The dashboard encountered an unexpected error.
                            </p>
                            {error.digest && (
                                <p className="text-zinc-600 text-xs">
                                    Error ID: {error.digest}
                                </p>
                            )}
                        </div>

                        <div className="border-t border-zinc-800 pt-4 mt-4">
                            <p className="text-amber-400 mb-4 flex items-center gap-2">
                                <span className="animate-pulse">▌</span>
                                Retrying...
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={reset}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors font-sans text-sm font-medium"
                                >
                                    ↻ Reset Connection
                                </button>
                                <a
                                    href="/"
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors font-sans text-sm"
                                >
                                    ← Back to Home
                                </a>
                            </div>
                        </div>

                        {/* Fake terminal output */}
                        <div className="mt-6 text-xs text-zinc-600 space-y-1">
                            <p>
                                <span className="text-zinc-700">[{new Date().toISOString()}]</span>{" "}
                                Dashboard segment failed to render
                            </p>
                            <p>
                                <span className="text-zinc-700">[recovery]</span>{" "}
                                Click Reset to attempt re-render
                            </p>
                        </div>
                    </div>
                </div>

                {/* Help text */}
                <p className="text-center text-zinc-600 text-sm mt-6">
                    If this error persists, please contact support.
                </p>
            </div>
        </div>
    );
}
