"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { formatDistanceToNow } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from "recharts";
import { useAuth } from "@clerk/nextjs";
// Skeleton components
function CardSkeleton() {
    return (
        <div className="p-6 bg-white rounded-xl border border-zinc-200 animate-pulse">
            <div className="h-4 w-24 bg-zinc-200 rounded mb-4" />
            <div className="h-8 w-16 bg-zinc-200 rounded mb-2" />
            <div className="h-3 w-32 bg-zinc-200 rounded" />
        </div>
    );
}

function ChartSkeleton() {
    return (
        <div className="h-[200px] bg-zinc-100 rounded-lg animate-pulse flex items-center justify-center">
            <span className="text-zinc-400">Loading chart...</span>
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-zinc-50 rounded-lg">
                    <div className="w-3 h-3 bg-zinc-200 rounded-full" />
                    <div className="flex-1 h-4 bg-zinc-200 rounded" />
                    <div className="w-16 h-4 bg-zinc-200 rounded" />
                    <div className="w-20 h-4 bg-zinc-200 rounded" />
                </div>
            ))}
        </div>
    );
}

// Status dot component
function StatusDot({ status }: { status: number }) {
    const color =
        status >= 200 && status < 300
            ? "bg-green-500"
            : status === 429
                ? "bg-amber-500"
                : "bg-red-500";

    return <div className={`w-2.5 h-2.5 rounded-full ${color}`} />;
}

export default function DashboardPage() {
    const { userId } = useAuth();

    if (userId === null || userId === undefined) {
        return <div className="p-8">Please log in to view your dashboard.</div>;
    }
    // Fetch logs from Convex
    const logs = useQuery(api.logs.getRecentLogs, { userId, limit: 50 });

    // Fetch user info
    const user = useQuery(api.users.getUser, { userId });

    // Transform logs for chart (group by day)
    const chartData = logs
        ? Object.values(
            logs.reduce((acc: Record<string, { name: string; reqs: number }>, log) => {
                const date = new Date(log.timestamp);
                const day = date.toLocaleDateString("en-US", { weekday: "short" });
                if (!acc[day]) {
                    acc[day] = { name: day, reqs: 0 };
                }
                acc[day].reqs += 1;
                return acc;
            }, {})
        )
        : [];

    // Calculate stats
    const todayLogs = logs?.filter((log) => {
        const today = new Date();
        const logDate = new Date(log.timestamp);
        return logDate.toDateString() === today.toDateString();
    });

    const requestsToday = todayLogs?.length || 0;
    const userTier = user?.tier || "free";
    const dailyLimit = userTier === "pro" ? 10000 : 100;
    const remaining = dailyLimit - requestsToday;

    return (
        <div className="p-8 space-y-8 bg-zinc-50 min-h-screen">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
                    Dashboard
                </h1>
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 uppercase">
                    {userTier} Plan
                </span>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {!logs ? (
                    <>
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                    </>
                ) : (
                    <>
                        <div className="p-6 bg-white rounded-xl border border-zinc-200 shadow-sm">
                            <p className="text-sm font-medium text-zinc-500 mb-1">
                                Requests Today
                            </p>
                            <p className="text-3xl font-bold text-zinc-900">{requestsToday}</p>
                            <p className="text-xs text-zinc-400 mt-1">
                                {logs.length} total this week
                            </p>
                        </div>

                        <div className="p-6 bg-white rounded-xl border border-zinc-200 shadow-sm">
                            <p className="text-sm font-medium text-zinc-500 mb-1">
                                Limit Remaining
                            </p>
                            <p className="text-3xl font-bold text-zinc-900">
                                {remaining.toLocaleString()}
                            </p>
                            <p className="text-xs text-zinc-400 mt-1">
                                {userTier === "pro" ? "Pro" : "Free"} Plan ({dailyLimit.toLocaleString()}/day)
                            </p>
                        </div>

                        <div className="p-6 bg-white rounded-xl border border-zinc-200 shadow-sm">
                            <p className="text-sm font-medium text-zinc-500 mb-1">
                                Success Rate
                            </p>
                            <p className="text-3xl font-bold text-zinc-900">
                                {logs.length > 0
                                    ? Math.round(
                                        (logs.filter((l) => l.status === 200).length / logs.length) *
                                        100
                                    )
                                    : 100}
                                %
                            </p>
                            <p className="text-xs text-zinc-400 mt-1">Last 50 requests</p>
                        </div>
                    </>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Analytics Chart */}
                <div className="col-span-4 p-6 bg-white rounded-xl border border-zinc-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                        Usage Analytics
                    </h2>
                    {!logs ? (
                        <ChartSkeleton />
                    ) : chartData.length === 0 ? (
                        <div className="h-[200px] flex items-center justify-center text-zinc-400">
                            No data yet. Make some API requests!
                        </div>
                    ) : (
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="name"
                                        stroke="#a1a1aa"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#a1a1aa"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#18181b",
                                            borderRadius: "8px",
                                            border: "none",
                                            color: "#fff",
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="reqs"
                                        stroke="#6366f1"
                                        strokeWidth={2}
                                        fill="url(#colorReqs)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="col-span-3 p-6 bg-white rounded-xl border border-zinc-200 shadow-sm">
                    <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                        Quick Stats
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-500">Avg Latency</span>
                            <span className="text-sm font-medium text-zinc-900">
                                {logs && logs.length > 0
                                    ? `${Math.round(
                                        logs.reduce((a, b) => a + b.duration, 0) / logs.length
                                    )}ms`
                                    : "--"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-500">Rate Limited</span>
                            <span className="text-sm font-medium text-amber-600">
                                {logs?.filter((l) => l.status === 429).length || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-500">Errors</span>
                            <span className="text-sm font-medium text-red-600">
                                {logs?.filter((l) => l.status >= 500).length || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-500">Unique Endpoints</span>
                            <span className="text-sm font-medium text-zinc-900">
                                {logs ? new Set(logs.map((l) => l.endpoint)).size : 0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Log Table */}
            <div className="p-6 bg-white rounded-xl border border-zinc-200 shadow-sm">
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                    Recent Requests
                </h2>

                {!logs ? (
                    <TableSkeleton />
                ) : logs.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400">
                        <p className="text-4xl mb-2">📡</p>
                        <p>No requests yet. Your API activity will appear here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-100">
                                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Endpoint
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Latency
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Time
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.slice(0, 10).map((log, i) => (
                                    <tr
                                        key={log.request_id || i}
                                        className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors"
                                    >
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <StatusDot status={log.status} />
                                                <span className="text-sm font-mono text-zinc-600">
                                                    {log.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm font-mono text-zinc-700">
                                                {log.endpoint}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm text-zinc-600">
                                                {log.duration}ms
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-sm text-zinc-500">
                                                {formatDistanceToNow(new Date(log.timestamp), {
                                                    addSuffix: true,
                                                })}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}