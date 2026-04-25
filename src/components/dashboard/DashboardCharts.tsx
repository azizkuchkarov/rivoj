"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type MonthlyPoint = { month: string; label: string; totalSom: number };

export function DashboardCharts({ data }: { data: MonthlyPoint[] }) {
  const formatter = new Intl.NumberFormat("uz-UZ");

  return (
    <Card className="min-w-0 border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg md:text-xl">To‘lovlar dinamikasi</CardTitle>
        <CardDescription>Oxirgi oylar — jami summa (so‘m)</CardDescription>
      </CardHeader>
      <CardContent className="h-[280px] min-w-0 pt-2">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Grafik uchun ma’lumot yetarli emas.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/80" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" />
              <YAxis
                tickFormatter={(v) => formatter.format(Number(v))}
                tickLine={false}
                axisLine={false}
                width={56}
                className="text-xs fill-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border)",
                  fontSize: 12,
                }}
                formatter={(value) => {
                  const n = typeof value === "number" ? value : Number(value) || 0;
                  return [`${formatter.format(n)} so‘m`, "Jami"];
                }}
              />
              <Area
                type="monotone"
                dataKey="totalSom"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                fill="url(#fillPrimary)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
