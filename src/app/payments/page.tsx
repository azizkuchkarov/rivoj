import Link from "next/link";

import { Banknote } from "lucide-react";

import { PaymentsDataTable } from "@/components/payments/PaymentsDataTable";
import type { PaymentRow } from "@/components/payments/payments-columns";
import { PaymentsStudentFilter } from "@/components/payments/PaymentsStudentFilter";
import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { formatSomUZS } from "@/lib/format-currency";
import { paymentTeacherShareDetail } from "@/lib/payment-teacher-share-detail";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ studentId?: string }>;
};

export default async function PaymentsPage({ searchParams }: PageProps) {
  const { studentId: filterStudentId } = await searchParams;

  let payments;
  let studentsForFilter;
  let paymentTotalAgg;
  let effectiveStudentId: string | undefined;
  try {
    studentsForFilter = await prisma.student.findMany({
      where: { isActive: true },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true },
    });

    effectiveStudentId =
      filterStudentId && studentsForFilter.some((s) => s.id === filterStudentId) ? filterStudentId : undefined;

    const where = effectiveStudentId ? { studentId: effectiveStudentId } : {};
    [payments, paymentTotalAgg] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          student: { select: { id: true, fullName: true } },
          teacher: { select: { id: true, fullName: true } },
        },
        orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
      }),
      prisma.payment.aggregate({
        where,
        _sum: { amountSom: true },
      }),
    ]);
  } catch {
    return <DbUnavailable />;
  }

  const sumDisplay = paymentTotalAgg._sum.amountSom ?? 0;

  const rows: PaymentRow[] = payments.map((p) => ({
    id: p.id,
    paidAt: p.paidAt,
    amountSom: p.amountSom,
    kind: p.kind,
    method: p.method,
    description: p.description,
    student: p.student,
    teacher: p.teacher,
    shareDetail: paymentTeacherShareDetail(p),
  }));

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
          <Banknote className="size-3.5" aria-hidden />
          Hisob
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">To‘lovlar</h1>
        <p className="max-w-xl text-sm text-muted-foreground md:text-[15px] md:leading-relaxed">
          TanStack jadvali, filtr va jami. Yangi to‘lovlar «Yangi dars» rejasi orqali kiritiladi.
        </p>
      </header>

      <Card className="border-border/80 shadow-sm">
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <label htmlFor="filter-student" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              O‘quvchi bo‘yicha filtr
            </label>
            <PaymentsStudentFilter students={studentsForFilter} currentStudentId={effectiveStudentId} />
          </div>
          <div className="rounded-lg border border-border/80 bg-muted/40 px-4 py-3 text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tanlangan filtr bo‘yicha jami</p>
            <p className="font-display text-xl font-semibold tabular-nums">{formatSomUZS(sumDisplay)} so‘m</p>
          </div>
        </CardContent>
      </Card>

      {payments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <p className="font-display text-lg font-medium">Hozircha to‘lov yozuvlari yo‘q</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Yangi to‘lovlar{" "}
              <Link href="/schedule/new" className="font-medium text-primary underline-offset-4 hover:underline">
                Yangi dars
              </Link>{" "}
              bo‘limida jadval bilan birga saqlanadi.
            </p>
          </CardContent>
        </Card>
      ) : (
        <PaymentsDataTable data={rows} />
      )}
    </div>
  );
}
