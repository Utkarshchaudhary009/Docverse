"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Mock Data for Charts
const data = [
    { name: "Mon", reqs: 40 },
    { name: "Tue", reqs: 30 },
    { name: "Wed", reqs: 20 },
    { name: "Thu", reqs: 27 },
    { name: "Fri", reqs: 18 },
    { name: "Sat", reqs: 23 },
    { name: "Sun", reqs: 34 },
];

export default function DashboardPage() {
    return (
        <div className="p-8 space-y-8 bg-zinc-50 min-h-screen">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Requests Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">124</div>
                        <p className="text-xs text-muted-foreground">+20.1% from yesterday</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Limit Remaining</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">9,876</div>
                        <p className="text-xs text-muted-foreground">Pro Plan (10k/day)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">2</div>
                        <p className="text-xs text-muted-foreground">Max 5 keys</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Analytics Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Usage Analytics</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#f4f4f5", borderRadius: "8px", border: "none" }}
                                        itemStyle={{ color: "#18181b" }}
                                    />
                                    <Line type="monotone" dataKey="reqs" stroke="#18181b" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* API Keys Management */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>API Keys</CardTitle>
                        <CardDescription>Manage your access keys.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-2 border rounded-md">
                                <div className="flex flex-col space-y-1">
                                    <span className="font-medium text-sm">Main App Key</span>
                                    <span className="text-xs text-zinc-500 font-mono">sk_live_...9f3a</span>
                                </div>
                                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">Revoke</Button>
                            </div>
                            <div className="flex items-center justify-between p-2 border rounded-md">
                                <div className="flex flex-col space-y-1">
                                    <span className="font-medium text-sm">Dev Key</span>
                                    <span className="text-xs text-zinc-500 font-mono">sk_test_...1a2b</span>
                                </div>
                                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">Revoke</Button>
                            </div>
                            <Button className="w-full">Create New Key</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
