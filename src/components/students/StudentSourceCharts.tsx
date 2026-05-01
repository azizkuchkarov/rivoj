"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PIE_COLORS = ["#6366f1", "#0ea5e9", "#22c55e", "#f59e0b", "#ec4899"];

export type StudentSourcePoint = {
  source: string;
  label: string;
  count: number;
};

export function StudentSourceCharts({ data }: { data: StudentSourcePoint[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg md:text-xl">Manbalar bo‘yicha taqsimot</CardTitle>
          <CardDescription>Yangi o‘quvchilar qaysi kanal orqali kelgani</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/80" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" />
              <Tooltip formatter={(value) => [`${Number(value)} ta`, "O‘quvchi"]} />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="var(--color-chart-1)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg md:text-xl">Ulushlar (foizda)</CardTitle>
          <CardDescription>Jami: {total} nafar o‘quvchi</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="label" innerRadius={60} outerRadius={90} paddingAngle={2}>
                {data.map((entry, idx) => (
                  <Cell key={entry.source} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, _name, item) => {
                  const count = Number(value) || 0;
                  const ratio = total > 0 ? Math.round((count / total) * 100) : 0;
                  return [`${count} ta (${ratio}%)`, item.payload?.label ?? "Manba"];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
