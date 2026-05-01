import Link from "next/link";

import { BarChart3, UsersRound } from "lucide-react";

import { StudentSourceCharts, type StudentSourcePoint } from "@/components/students/StudentSourceCharts";
import { Card, CardContent } from "@/components/ui/card";
import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { prisma } from "@/lib/prisma";
import { formatStudentSource, STUDENT_SOURCE_OPTIONS } from "@/lib/student-source";

export const dynamic = "force-dynamic";

export default async function StudentSourcesPage() {
  let data: StudentSourcePoint[] = [];
  let total = 0;
  try {
    const rows = await prisma.student.groupBy({
      by: ["source"],
      _count: { _all: true },
    });

    const countMap = new Map(rows.map((row) => [row.source, row._count._all]));
    data = STUDENT_SOURCE_OPTIONS.map((option) => ({
      source: option.value,
      label: formatStudentSource(option.value),
      count: countMap.get(option.value) ?? 0,
    }));
    total = data.reduce((sum, item) => sum + item.count, 0);
  } catch {
    return <DbUnavailable />;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link href="/students" className="text-sm font-medium text-violet-800 underline-offset-4 hover:underline">
          ← O‘quvchilar ro‘yxati
        </Link>
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
          <BarChart3 className="size-3.5" aria-hidden />
          Analitika
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">O‘quvchi manbalari</h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-[15px] md:leading-relaxed">
          Admin uchun qaysi kanal orqali qancha o‘quvchi kelayotganini kuzatish paneli.
        </p>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardContent className="flex items-center justify-between gap-4 py-6">
          <div>
            <p className="text-sm text-muted-foreground">Jami o‘quvchilar</p>
            <p className="font-display text-3xl font-semibold tabular-nums">{total}</p>
          </div>
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UsersRound className="size-5" aria-hidden />
          </span>
        </CardContent>
      </Card>

      <StudentSourceCharts data={data} />

      <Card className="border-border/80 shadow-sm">
        <CardContent className="py-5">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((item) => (
              <div key={item.source} className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-xl font-semibold tabular-nums">{item.count} ta</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
