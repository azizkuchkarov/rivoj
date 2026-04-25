import type { MonthlyPoint } from "@/components/dashboard/DashboardCharts";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function startOfCalendarMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1, 0, 0, 0, 0);
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(d: Date) {
  return new Intl.DateTimeFormat("uz-UZ", { month: "short", year: "numeric" }).format(d);
}

export default async function HomePage() {
  const now = new Date();
  const monthStart = startOfCalendarMonth(now);
  const monthEnd = addMonths(monthStart, 1);
  const chartFrom = addMonths(monthStart, -5);

  try {
    const [
      teacherTotal,
      teacherActive,
      studentTotal,
      studentActive,
      paymentMonthAgg,
      paymentsForChart,
    ] = await Promise.all([
      prisma.teacher.count(),
      prisma.teacher.count({ where: { isActive: true } }),
      prisma.student.count(),
      prisma.student.count({ where: { isActive: true } }),
      prisma.payment.aggregate({
        where: { paidAt: { gte: monthStart, lt: monthEnd } },
        _sum: { amountSom: true },
      }),
      prisma.payment.findMany({
        where: { paidAt: { gte: chartFrom, lt: monthEnd } },
        select: { paidAt: true, amountSom: true },
      }),
    ]);

    const bucket = new Map<string, number>();
    for (const p of paymentsForChart) {
      const k = monthKey(p.paidAt);
      bucket.set(k, (bucket.get(k) ?? 0) + p.amountSom);
    }

    const chartData: MonthlyPoint[] = [];
    for (let i = 0; i < 6; i++) {
      const m = addMonths(chartFrom, i);
      const key = monthKey(m);
      chartData.push({
        month: key,
        label: monthLabel(m),
        totalSom: bucket.get(key) ?? 0,
      });
    }

    return (
      <DashboardHome
        teacherActive={teacherActive}
        teacherTotal={teacherTotal}
        studentActive={studentActive}
        studentTotal={studentTotal}
        paymentMonthSom={paymentMonthAgg._sum.amountSom ?? 0}
        chartData={chartData}
      />
    );
  } catch {
    return <DbUnavailable />;
  }
}
