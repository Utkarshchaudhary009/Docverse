"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"; // Simple Bar Chart

const globalData = [
    { name: "Mon", total: 4000 },
    { name: "Tue", total: 3000 },
    { name: "Wed", total: 2000 },
    { name: "Thu", total: 2780 },
    { name: "Fri", total: 1890 },
    { name: "Sat", total: 2390 },
    { name: "Sun", total: 3490 },
];

const users = [
    { id: "u_1", name: "Alice", email: "alice@example.com", tier: "Pro", usage: 8900, status: "Active" },
    { id: "u_2", name: "Bob", email: "bob@example.com", tier: "Free", usage: 45, status: "Active" },
    { id: "u_3", name: "Charlie", email: "charlie@example.com", tier: "Free", usage: 90, status: "Rate Limited" },
];

export default function AdminPage() {
    return (
        <div className="p-8 space-y-8 bg-zinc-50 min-h-screen">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Admin Dashboard</h1>

            {/* Global Analytics */}
            <Card>
                <CardHeader>
                    <CardTitle>Global Platform Usage</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={globalData}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: "#f4f4f5", borderRadius: "8px", border: "none" }}
                                />
                                <Bar dataKey="total" fill="#18181b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* User Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Tier</TableHead>
                                <TableHead>Daily Usage</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((u) => (
                                <TableRow key={u.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{u.name}</span>
                                            <span className="text-xs text-muted-foreground">{u.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{u.tier}</TableCell>
                                    <TableCell>{u.usage}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${u.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {u.status}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
