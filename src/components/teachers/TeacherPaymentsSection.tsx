import Link from "next/link";

import { Banknote } from "lucide-react";

import { formatSomUZS } from "@/lib/format-currency";
import { paymentTeacherShareDetail } from "@/lib/payment-teacher-share-detail";
import { paymentKindLabel, paymentMethodLabel } from "@/lib/payment-labels";
import type { Payment, Student } from "@/generated/prisma/client";

type PaymentRow = Payment & {
  student: Pick<Student, "id" | "fullName">;
};

type TeacherPaymentsSectionProps = {
  payments: PaymentRow[];
  totalTeacherShareSom: number;
  lessonEarningsSom?: number;
};

export function TeacherPaymentsSection({
  payments,
  totalTeacherShareSom,
  lessonEarningsSom = 0,
}: TeacherPaymentsSectionProps) {
  const dailyTotals = new Map<string, number>();
  for (const p of payments) {
    const dayKey = p.paidAt.toISOString().slice(0, 10);
    const prev = dailyTotals.get(dayKey) ?? 0;
    dailyTotals.set(dayKey, prev + (p.teacherShareSom ?? 0));
  }
  const dailyTotalRows = [...dailyTotals.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dateIso, amountSom]) => ({ dateIso, amountSom }));

  return (
    <section className="rounded-3xl border border-border bg-[color:var(--surface)] p-6 shadow-sm md:p-8">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--ink)]">
          <Banknote className="h-5 w-5 text-teal-600" aria-hidden />
          Sizga belgilangan to‘lovlar
        </h2>
        <p className="text-sm text-black">
          Administrator to‘lovda sizni tanlaganda, shu yerda ko‘rinadigan ulushlar (kunlik yoki abonentlik bo‘yicha).
        </p>
        <p className="text-sm text-[var(--ink-soft)]">
          Jami ulush:{" "}
          <span className="font-semibold tabular-nums text-teal-900">{formatSomUZS(totalTeacherShareSom)} so‘m</span>
          <span className="text-zinc-400"> ({payments.length} ta yozuv)</span>
        </p>
        {lessonEarningsSom > 0 ? (
          <p className="text-sm text-[var(--ink-soft)]">
            Darsda belgilangan (keldi / to‘lov):{" "}
            <span className="font-semibold tabular-nums text-teal-900">{formatSomUZS(lessonEarningsSom)} so‘m</span>
          </p>
        ) : null}
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-100 bg-white p-4">
        <h3 className="text-sm font-semibold text-[var(--ink)]">Har kunlik umumiy summa</h3>
        {dailyTotalRows.length === 0 ? (
          <p className="mt-2 text-sm text-black">Hozircha kunlik umumiy yozuv yo‘q.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-100">
            <table className="w-full min-w-[360px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-3 py-2.5 font-semibold text-zinc-700">Sana</th>
                  <th className="px-3 py-2.5 font-semibold text-zinc-700">Kunlik jami ulush</th>
                </tr>
              </thead>
              <tbody>
                {dailyTotalRows.map((r) => {
                  const dateLabel = new Intl.DateTimeFormat("uz-UZ", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(`${r.dateIso}T12:00:00.000Z`));
                  return (
                    <tr key={r.dateIso} className="border-b border-zinc-100 last:border-0">
                      <td className="px-3 py-2.5 text-[var(--ink-soft)]">{dateLabel}</td>
                      <td className="px-3 py-2.5 font-semibold tabular-nums text-teal-900">
                        {formatSomUZS(r.amountSom)} so‘m
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {payments.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 px-6 py-10 text-center text-sm text-black">
          Hozircha sizga biriktirilgan to‘lov yozuvlari yo‘q.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-100">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-indigo-50">
                <th className="px-3 py-2.5 font-semibold text-zinc-700">Sana</th>
                <th className="px-3 py-2.5 font-semibold text-zinc-700">O‘quvchi</th>
                <th className="px-3 py-2.5 font-semibold text-zinc-700">Tur</th>
                <th className="px-3 py-2.5 font-semibold text-zinc-700">O‘quvchi to‘lovi</th>
                <th className="px-3 py-2.5 font-semibold text-teal-900">Sizga ulush</th>
                <th className="px-3 py-2.5 font-semibold text-zinc-700">Hisob-kitob</th>
                <th className="px-3 py-2.5 font-semibold text-zinc-700">Usul</th>
                <th className="px-3 py-2.5 font-semibold text-zinc-700">Izoh</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const paid = new Intl.DateTimeFormat("uz-UZ", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }).format(p.paidAt);
                const share = p.teacherShareSom ?? 0;
                const detail = paymentTeacherShareDetail(p);
                return (
                  <tr key={p.id} className="border-b border-zinc-100 odd:bg-white">
                    <td className="whitespace-nowrap px-3 py-2.5 text-[var(--ink-soft)]">{paid}</td>
                    <td className="max-w-[160px] px-3 py-2.5">
                      <Link
                        href={`/students/${p.student.id}`}
                        className="font-medium text-teal-900 underline-offset-4 hover:underline"
                      >
                        {p.student.fullName}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-[var(--ink)]">{paymentKindLabel(p.kind)}</td>
                    <td className="px-3 py-2.5 tabular-nums text-[var(--ink)]">
                      {formatSomUZS(p.amountSom)} so‘m
                    </td>
                    <td className="px-3 py-2.5 font-semibold tabular-nums text-teal-900">
                      {formatSomUZS(share)} so‘m
                    </td>
                    <td className="max-w-[200px] px-3 py-2.5 text-xs text-black" title={detail}>
                      {detail}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-[var(--ink-soft)]">
                      {paymentMethodLabel(p.method)}
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-2.5 text-black" title={p.description ?? ""}>
                      {p.description ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-black">
        Markazdagi barcha to‘lovlar:{" "}
        <Link href="/payments" className="font-medium text-teal-800 underline-offset-4 hover:underline">
          To‘lovlar
        </Link>
      </p>
    </section>
  );
}
