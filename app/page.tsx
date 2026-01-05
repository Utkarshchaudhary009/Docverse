"use client";

import { useState, useEffect } from "react";

interface Library {
  _id: string;
  slug: string;
  name: string;
  description: string;
  category: "frontend" | "backend" | "language" | "database";
  logo_url?: string;
  is_active?: boolean;
}

export default function Home() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLibraries() {
      try {
        const res = await fetch("/api/libraries");
        if (res.ok) {
          const data = await res.json();
          setLibraries(data);
        }
      } catch (error) {
        console.error("Failed to fetch libraries:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLibraries();
  }, []);

  const filteredLibraries = libraries.filter(
    (lib) =>
      lib.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lib.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lib.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="min-h-screen bg-grid">
      {/* Hero Section */}
      <section className="relative px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl text-center">
          {/* Glow Effect Behind Title */}
          <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,_var(--accent-glow)_0%,_transparent_70%)] opacity-30 blur-3xl pointer-events-none" />

          <h1 className="relative text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-in glow-text">
            Give Your AI{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Infinite Context
            </span>
          </h1>

          <p className="relative text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-12 animate-fade-in-delay-1">
            The Universal Registry for Model Context Protocols.
          </p>

          {/* Search Input */}
          <div className="relative max-w-2xl mx-auto animate-fade-in-delay-2">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-zinc-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search libraries by name, category, or description..."
              className="search-input pl-14"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Library Grid */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="glass-card p-6 animate-pulse"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-zinc-800 rounded-xl" />
                    <div className="flex-1">
                      <div className="h-5 bg-zinc-800 rounded w-2/3 mb-2" />
                      <div className="h-3 bg-zinc-800 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="h-4 bg-zinc-800 rounded w-full mb-2" />
                  <div className="h-4 bg-zinc-800 rounded w-4/5" />
                </div>
              ))}
            </div>
          ) : filteredLibraries.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-zinc-300 mb-2">
                {searchQuery ? "No libraries found" : "No libraries yet"}
              </h3>
              <p className="text-zinc-500">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Check back soon for new additions"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLibraries.map((lib, index) => (
                <a
                  key={lib._id}
                  href={`/${lib.slug}`}
                  className="glass-card gradient-border p-6 block cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-2xl">
                        {lib.logo_url ? (
                          <img
                            src={lib.logo_url}
                            alt={lib.name}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          getCategoryIcon(lib.category)
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-zinc-100">
                          {lib.name}
                        </h3>
                        <span className="badge-category">{lib.category}</span>
                      </div>
                    </div>
                    {lib.is_active !== false && (
                      <span className="badge-verified">✓ Verified</span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2">
                    {lib.description}
                  </p>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                    <span className="text-xs text-zinc-500 font-mono">
                      /{lib.slug}/mcp
                    </span>
                    <svg
                      className="w-4 h-4 text-zinc-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-zinc-500 text-sm">
          <p>Docverse — The Universal MCP Registry</p>
        </div>
      </footer>
    </div>
  );
}
