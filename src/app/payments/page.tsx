import Link from "next/link";

import { Banknote } from "lucide-react";

import { deletePayment } from "@/app/payments/actions";
import { DeleteConfirmForm } from "@/components/common/DeleteConfirmForm";
import { PaymentsStudentFilter } from "@/components/payments/PaymentsStudentFilter";
import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { prisma } from "@/lib/prisma";
import { formatSomUZS } from "@/lib/format-currency";
import { paymentTeacherShareDetail } from "@/lib/payment-teacher-share-detail";
import { paymentKindLabel, paymentMethodLabel } from "@/lib/payment-labels";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ studentId?: string }>;
};

export default async function PaymentsPage({ searchParams }: PageProps) {
  const { studentId: filterStudentId } = await searchParams;

  let payments;
  let studentsForFilter;
  let paymentTotalAgg;
  try {
    const where = filterStudentId ? { studentId: filterStudentId } : {};
    [payments, studentsForFilter, paymentTotalAgg] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          student: { select: { id: true, fullName: true } },
          teacher: { select: { id: true, fullName: true } },
        },
        orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
      }),
      prisma.student.findMany({
        where: { isActive: true },
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true },
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

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-800 ring-1 ring-violet-100">
          <Banknote className="h-3.5 w-3.5" aria-hidden />
          Hisob
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
          To‘lovlar
        </h1>
        <p className="max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">
          Ro‘yxat va jami: filtr orqali bitta o‘quvchini tanlashingiz mumkin. Yangi to‘lovlar «Yangi dars» rejasi
          orqali kiritiladi.
        </p>
      </header>

      <div className="flex flex-col gap-4 rounded-2xl border border-white/70 bg-[color:var(--surface)] p-4 shadow-inner shadow-black/5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <label htmlFor="filter-student" className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            O‘quvchi bo‘yicha filtr
          </label>
          <PaymentsStudentFilter students={studentsForFilter} currentStudentId={filterStudentId} />
        </div>
        <div className="rounded-xl bg-violet-50/80 px-4 py-3 text-right ring-1 ring-violet-100">
          <p className="text-xs font-medium uppercase tracking-wide text-violet-700">Tanlangan filtr bo‘yicha jami</p>
          <p className="font-display text-xl font-semibold tabular-nums text-violet-950">
            {formatSomUZS(sumDisplay)} so‘m
          </p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-violet-200/90 bg-white/50 px-8 py-16 text-center">
          <p className="font-display text-lg font-medium text-[var(--ink)]">Hozircha to‘lov yozuvlari yo‘q</p>
          <p className="mt-3 text-sm text-[var(--muted)]">
            Yangi to‘lovlar{" "}
            <Link href="/schedule/new" className="font-medium text-violet-800 underline-offset-4 hover:underline">
              Yangi dars
            </Link>{" "}
            bo‘limida jadval bilan birga saqlanadi.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/70 bg-[color:var(--surface)] shadow-lg shadow-black/5">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-violet-50/80">
                <th className="px-4 py-3 font-semibold text-zinc-700">Sana</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">O‘quvchi</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Tur</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Summa</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">O‘qituvchi</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">O‘q. ulushi</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Usul</th>
                <th className="px-4 py-3 font-semibold text-zinc-700">Maqsad</th>
                <th className="px-4 py-3 font-semibold text-zinc-700 w-[100px]"> </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const paid = new Intl.DateTimeFormat("uz-UZ", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).format(p.paidAt);
                const shareLine = paymentTeacherShareDetail(p);
                return (
                  <tr key={p.id} className="border-b border-zinc-100/90 odd:bg-white/50">
                    <td className="whitespace-nowrap px-4 py-3 text-[var(--ink-soft)]">{paid}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/students/${p.student.id}`}
                        className="font-medium text-violet-800 underline-offset-4 hover:underline"
                      >
                        {p.student.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--ink)]">{paymentKindLabel(p.kind)}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-[var(--ink)]">
                      {formatSomUZS(p.amountSom)} so‘m
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-3 text-[var(--ink-soft)]" title={p.teacher?.fullName ?? ""}>
                      {p.teacher ? (
                        <Link
                          href={`/teachers/${p.teacher.id}`}
                          className="font-medium text-violet-800 underline-offset-4 hover:underline"
                        >
                          {p.teacher.fullName}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-[200px] px-4 py-3 text-xs text-[var(--muted)]" title={shareLine}>
                      {shareLine}
                    </td>
                    <td className="px-4 py-3 text-[var(--ink-soft)]">{paymentMethodLabel(p.method)}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-[var(--muted)]" title={p.description ?? ""}>
                      {p.description ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <DeleteConfirmForm
                        action={deletePayment}
                        id={p.id}
                        displayName={`${formatSomUZS(p.amountSom)} so‘m · ${p.student.fullName}`}
                        entityLabel="To‘lovni"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
