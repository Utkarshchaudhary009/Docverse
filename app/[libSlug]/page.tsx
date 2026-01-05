"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Library {
    _id: string;
    slug: string;
    name: string;
    description: string;
    category: "frontend" | "backend" | "language" | "database";
    logo_url?: string;
    official_docs_url?: string;
    github_url?: string;
    is_active?: boolean;
}

function createConfetti() {
    const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#22c55e", "#f59e0b"];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement("div");
        confetti.className = "confetti-piece";
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = `${Math.random() * 0.5}s`;
        confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
        confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "0";
        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 4000);
    }
}

export default function LibraryDetailPage() {
    const params = useParams();
    const libSlug = params.libSlug as string;

    const [library, setLibrary] = useState<Library | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function fetchLibrary() {
            try {
                const res = await fetch(`/api/libraries/${libSlug}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setError("Library not found");
                    } else {
                        setError("Failed to load library");
                    }
                    return;
                }
                const data = await res.json();
                setLibrary(data);
            } catch (err) {
                console.error("Failed to fetch library:", err);
                setError("Failed to load library");
            } finally {
                setLoading(false);
            }
        }

        if (libSlug) {
            fetchLibrary();
        }
    }, [libSlug]);

    const mcpConfig = library
        ? JSON.stringify(
            {
                mcpServers: {
                    Docverse: {
                        url: `https://docverse.com/api/${library.slug}/mcp`,
                        headers: { "x-api-key": "YOUR_KEY" },
                    },
                },
            },
            null,
            2
        )
        : "";

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(mcpConfig);
            setCopied(true);
            createConfetti();
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    }, [mcpConfig]);

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "frontend":
                return "🎨";
            case "backend":
                return "⚙️";
            case "language":
                return "📝";
            case "database":
                return "🗄️";
            default:
                return "📦";
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-grid flex items-center justify-center">
                <div className="animate-pulse text-zinc-400">Loading...</div>
            </div>
        );
    }

    if (error || !library) {
        return (
            <div className="min-h-screen bg-grid flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">😕</div>
                    <h1 className="text-2xl font-bold text-zinc-100 mb-2">
                        {error || "Library not found"}
                    </h1>
                    <Link
                        href="/"
                        className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        ← Back to Registry
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-grid">
            {/* Navigation */}
            <nav className="border-b border-zinc-800/50 px-6 py-4">
                <div className="mx-auto max-w-4xl">
                    <Link
                        href="/"
                        className="text-zinc-400 hover:text-zinc-100 transition-colors inline-flex items-center gap-2"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        Back to Registry
                    </Link>
                </div>
            </nav>

            {/* Library Header */}
            <section className="px-6 py-12">
                <div className="mx-auto max-w-4xl">
                    <div className="flex items-start gap-6 mb-8">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-4xl shrink-0">
                            {library.logo_url ? (
                                <img
                                    src={library.logo_url}
                                    alt={library.name}
                                    className="w-12 h-12 object-contain"
                                />
                            ) : (
                                getCategoryIcon(library.category)
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl md:text-4xl font-bold text-zinc-100">
                                    {library.name}
                                </h1>
                                {library.is_active !== false && (
                                    <span className="badge-verified">✓ Verified</span>
                                )}
                            </div>
                            <p className="text-lg text-zinc-400 mb-4">{library.description}</p>
                            <div className="flex flex-wrap gap-3">
                                <span className="badge-category">{library.category}</span>
                                {library.official_docs_url && (
                                    <a
                                        href={library.official_docs_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors inline-flex items-center gap-1"
                                    >
                                        📄 Docs
                                        <svg
                                            className="w-3 h-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                    </a>
                                )}
                                {library.github_url && (
                                    <a
                                        href={library.github_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors inline-flex items-center gap-1"
                                    >
                                        🐙 GitHub
                                        <svg
                                            className="w-3 h-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* One-Click Config */}
            <section className="px-6 pb-24">
                <div className="mx-auto max-w-4xl">
                    <div className="glass-card p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-zinc-100 mb-1">
                                    ⚡ One-Click Config
                                </h2>
                                <p className="text-sm text-zinc-400">
                                    Add this to your AI client configuration
                                </p>
                            </div>
                            <button
                                onClick={handleCopy}
                                className={`copy-btn ${copied ? "!bg-green-500" : ""}`}
                            >
                                {copied ? (
                                    <>
                                        <span className="inline-flex items-center gap-2">
                                            ✓ Copied!
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className="inline-flex items-center gap-2">
                                            📋 Copy Config
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="code-block">
                            <pre className="text-zinc-300 whitespace-pre-wrap">
                                <code>
                                    <span className="text-zinc-500">{"{"}</span>
                                    {"\n"}
                                    {"  "}
                                    <span className="text-purple-400">&quot;mcpServers&quot;</span>
                                    <span className="text-zinc-500">:</span>{" "}
                                    <span className="text-zinc-500">{"{"}</span>
                                    {"\n"}
                                    {"    "}
                                    <span className="text-purple-400">&quot;Docverse&quot;</span>
                                    <span className="text-zinc-500">:</span>{" "}
                                    <span className="text-zinc-500">{"{"}</span>
                                    {"\n"}
                                    {"      "}
                                    <span className="text-purple-400">&quot;url&quot;</span>
                                    <span className="text-zinc-500">:</span>{" "}
                                    <span className="text-green-400">
                                        &quot;https://docverse.com/api/{library.slug}/mcp&quot;
                                    </span>
                                    <span className="text-zinc-500">,</span>
                                    {"\n"}
                                    {"      "}
                                    <span className="text-purple-400">&quot;headers&quot;</span>
                                    <span className="text-zinc-500">:</span>{" "}
                                    <span className="text-zinc-500">{"{"}</span>{" "}
                                    <span className="text-purple-400">&quot;x-api-key&quot;</span>
                                    <span className="text-zinc-500">:</span>{" "}
                                    <span className="text-amber-400">&quot;YOUR_KEY&quot;</span>{" "}
                                    <span className="text-zinc-500">{"}"}</span>
                                    {"\n"}
                                    {"    "}
                                    <span className="text-zinc-500">{"}"}</span>
                                    {"\n"}
                                    {"  "}
                                    <span className="text-zinc-500">{"}"}</span>
                                    {"\n"}
                                    <span className="text-zinc-500">{"}"}</span>
                                </code>
                            </pre>
                        </div>

                        <div className="mt-6 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                            <p className="text-sm text-indigo-300">
                                💡 <strong>Tip:</strong> Replace{" "}
                                <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-amber-400">
                                    YOUR_KEY
                                </code>{" "}
                                with your API key from the{" "}
                                <Link href="/dashboard" className="underline hover:no-underline">
                                    Dashboard
                                </Link>
                                .
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-zinc-800/50 py-8">
                <div className="mx-auto max-w-4xl px-6 text-center text-zinc-500 text-sm">
                    <p>Docverse — The Universal MCP Registry</p>
                </div>
            </footer>
        </div>
    );
}
