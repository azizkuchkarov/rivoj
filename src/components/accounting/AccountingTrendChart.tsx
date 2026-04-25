"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type AccountingTrendPoint = {
  month: string;
  label: string;
  revenueSom: number;
  salarySom: number;
  consultationProfitSom: number;
  totalProfitSom: number;
};

export function AccountingTrendChart({ data }: { data: AccountingTrendPoint[] }) {
  const formatter = new Intl.NumberFormat("uz-UZ");

  return (
    <Card className="min-w-0 border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg md:text-xl">Oxirgi oylar dinamikasi</CardTitle>
        <CardDescription>Tushum, oylik va foyda taqqoslamasi</CardDescription>
      </CardHeader>
      <CardContent className="h-[320px] min-w-0 pt-2">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16a34a" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#16a34a" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="salaryFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" />
            <YAxis
              tickFormatter={(v) => formatter.format(Number(v))}
              tickLine={false}
              axisLine={false}
              width={64}
              className="text-xs fill-muted-foreground"
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }}
              formatter={(value, name) => {
                const n = typeof value === "number" ? value : Number(value) || 0;
                const label =
                  name === "revenueSom"
                    ? "Tushum"
                    : name === "salarySom"
                      ? "Oylik"
                      : name === "totalProfitSom"
                        ? "Umumiy foyda"
                        : "Konsultatsiya foydasi";
                return [`${formatter.format(n)} so‘m`, label];
              }}
            />
            <Legend
              formatter={(value) =>
                value === "revenueSom"
                  ? "Tushum"
                  : value === "salarySom"
                    ? "Oylik"
                    : value === "totalProfitSom"
                      ? "Umumiy foyda"
                      : "Konsultatsiya foydasi"
              }
            />
            <Area type="monotone" dataKey="revenueSom" stroke="#16a34a" fill="url(#revenueFill)" strokeWidth={2} />
            <Area type="monotone" dataKey="salarySom" stroke="#f59e0b" fill="url(#salaryFill)" strokeWidth={2} />
            <Area type="monotone" dataKey="totalProfitSom" stroke="#4f46e5" fill="url(#profitFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
