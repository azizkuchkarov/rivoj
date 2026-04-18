import Link from "next/link";

import { AlertTriangle, Banknote, CreditCard, Sparkles } from "lucide-react";

import { markGuardianFeePaid } from "@/app/students/actions";
import { deletePayment } from "@/app/payments/actions";
import { DeleteConfirmForm } from "@/components/common/DeleteConfirmForm";
import { formatSomUZS } from "@/lib/format-currency";
import { paymentKindLabel, paymentMethodLabel } from "@/lib/payment-labels";
import type { Payment, Teacher } from "@/generated/prisma/client";
import { cn } from "@/lib/cn";

export type GuardianDebtRow = {
  id: string;
  amountSom: number;
  lessonId: string;
  lesson: {
    lessonDate: Date;
    teacher: { id: string; fullName: string; listNumber: number };
  };
};

type PaymentWithTeacher = Payment & {
  teacher: Pick<Teacher, "id" | "fullName"> | null;
  lesson: {
    teacher: { id: string; fullName: string; listNumber: number };
  } | null;
};

type StudentPaymentsSectionProps = {
  studentId: string;
  studentFullName: string;
  payments: PaymentWithTeacher[];
  /** To‘lovdagi teacher bo‘lmasa ko‘rsatiladi */
  primaryTeacher: Pick<Teacher, "id" | "fullName"> | null;
  guardianDebts: GuardianDebtRow[];
  totalSom: number;
  debtTotalSom?: number;
  subscriptionLessonsRemainingTotal?: number;
};

type MergedEntry =
  | { row: "debt"; sort: number; debt: GuardianDebtRow }
  | { row: "payment"; sort: number; payment: PaymentWithTeacher };

function mergePaymentRows(payments: PaymentWithTeacher[], debts: GuardianDebtRow[]): MergedEntry[] {
  const merged: MergedEntry[] = [
    ...debts.map((d) => ({
      row: "debt" as const,
      sort: d.lesson.lessonDate.getTime(),
      debt: d,
    })),
    ...payments.map((p) => ({
      row: "payment" as const,
      sort: new Date(p.paidAt).getTime(),
      payment: p,
    })),
  ];
  merged.sort((a, b) => b.sort - a.sort);
  return merged;
}

function PaymentTeacherLink({
  payment,
  primaryTeacher,
}: {
  payment: PaymentWithTeacher;
  primaryTeacher: Pick<Teacher, "id" | "fullName"> | null;
}) {
  if (payment.teacher) {
    return (
      <Link
        href={`/teachers/${payment.teacher.id}`}
        className="font-medium text-violet-900 underline-offset-4 hover:underline"
      >
        {payment.teacher.fullName}
      </Link>
    );
  }
  const fromLesson = payment.lesson?.teacher;
  if (fromLesson) {
    return (
      <Link
        href={`/teachers/${fromLesson.id}`}
        className="font-medium text-violet-900 underline-offset-4 hover:underline"
        title="Dars jadvalidagi o‘qituvchi"
      >
        №{fromLesson.listNumber} {fromLesson.fullName}
      </Link>
    );
  }
  if (primaryTeacher) {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-1.5">
        <Link
          href={`/teachers/${primaryTeacher.id}`}
          className="font-medium text-violet-800/95 underline-offset-4 hover:underline"
        >
          {primaryTeacher.fullName}
        </Link>
        <span className="text-[10px] font-normal uppercase tracking-wide text-zinc-400">asosiy</span>
      </span>
    );
  }
  return <span className="text-zinc-400">—</span>;
}

export function StudentPaymentsSection({
  studentId,
  studentFullName,
  payments,
  primaryTeacher,
  guardianDebts,
  totalSom,
  debtTotalSom = 0,
  subscriptionLessonsRemainingTotal = 0,
}: StudentPaymentsSectionProps) {
  const merged = mergePaymentRows(payments, guardianDebts);
  const hasRows = merged.length > 0;

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-violet-200/50 bg-gradient-to-br from-violet-50/35 via-white to-fuchsia-50/20 p-[1px] shadow-[0_24px_60px_-28px_rgba(109,40,217,0.22)]">
      <div className="relative rounded-[1.7rem] bg-[color:var(--surface)] px-5 py-6 md:px-8 md:py-7">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-violet-400/12 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-28 w-48 rounded-full bg-fuchsia-300/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/15 to-purple-600/10 text-violet-800 ring-1 ring-violet-200/70 shadow-inner shadow-violet-900/5">
              <Banknote className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-800/80">Hisob</p>
              <h2 className="font-display text-xl font-semibold tracking-tight text-[var(--ink)] md:text-2xl">
                To‘lovlar
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-[var(--muted)]">
                Markaz yozuvlari va ota-ona to‘lovi kutilayotgan darslar. Ota-ona pul topshirgach, «To‘lov qilindi»
                tugmasini bosing.
              </p>
            </div>
          </div>
          <Link
            href={`/payments?studentId=${studentId}`}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full border border-violet-200/90 bg-white px-5 py-2.5 text-sm font-semibold text-violet-900 shadow-sm ring-1 ring-violet-100/80 transition hover:border-violet-300 hover:bg-violet-50/90"
          >
            <CreditCard className="h-4 w-4 opacity-80" aria-hidden />
            Barcha yozuvlar
          </Link>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-violet-100/90 bg-gradient-to-br from-violet-50/80 to-white p-4 ring-1 ring-violet-100/70">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">Jami kiritilgan</p>
            <p className="mt-1.5 font-display text-xl font-semibold tabular-nums text-violet-950 md:text-2xl">
              {formatSomUZS(totalSom)} <span className="text-base font-medium text-violet-800/80">so‘m</span>
            </p>
            <p className="mt-1 text-xs text-violet-800/65">{payments.length} ta markaz yozuvi</p>
          </div>

          {debtTotalSom > 0 ? (
            <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/90 to-white p-4 ring-1 ring-amber-100/80">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Ota-ona to‘lovi kutilmoqda
              </div>
              <p className="mt-1.5 font-display text-xl font-semibold tabular-nums text-amber-950 md:text-2xl">
                {formatSomUZS(debtTotalSom)} <span className="text-base font-medium text-amber-900/80">so‘m</span>
              </p>
              <p className="mt-1 text-xs leading-snug text-amber-950/75">Pastdagi qatorlarda «To‘lov qilindi» bilan yopiladi.</p>
            </div>
          ) : null}

          {subscriptionLessonsRemainingTotal > 0 ? (
            <div className="rounded-2xl border border-teal-100/90 bg-gradient-to-br from-teal-50/80 to-white p-4 ring-1 ring-teal-100/80">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-teal-900">
                <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Abonentlik
              </div>
              <p className="mt-1.5 font-display text-xl font-semibold tabular-nums text-teal-950 md:text-2xl">
                {subscriptionLessonsRemainingTotal}{" "}
                <span className="text-base font-medium text-teal-900/85">dars qoldi</span>
              </p>
            </div>
          ) : null}
        </div>

        {!hasRows ? (
          <div className="relative mt-8 rounded-2xl border border-dashed border-violet-200/90 bg-gradient-to-b from-violet-50/40 to-white/50 px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100/90 text-violet-800 ring-1 ring-violet-200/80">
              <Banknote className="h-7 w-7 opacity-90" aria-hidden />
            </div>
            <p className="mt-5 font-medium text-[var(--ink)]">Hozircha yozuvlar yo‘q</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Yangi to‘lovni{" "}
              <Link href="/payments" className="font-medium text-violet-800 underline-offset-4 hover:underline">
                To‘lovlar
              </Link>{" "}
              bo‘limida yoki{" "}
              <Link href="/schedule/new" className="font-medium text-violet-800 underline-offset-4 hover:underline">
                Yangi dars
              </Link>{" "}
              rejasida kiritish mumkin.
            </p>
          </div>
        ) : (
          <div className="relative mt-8 overflow-hidden rounded-2xl border border-zinc-100/90 bg-white/50 shadow-inner shadow-black/[0.03]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200/90 bg-gradient-to-r from-violet-50/95 via-white to-fuchsia-50/40">
                    <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      Sana
                    </th>
                    <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      Turi
                    </th>
                    <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      Summa
                    </th>
                    <th className="max-w-[160px] px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      O‘qituvchi
                    </th>
                    <th className="min-w-[180px] px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      Ota-ona to‘lovi
                    </th>
                    <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      Usul
                    </th>
                    <th className="min-w-[100px] px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                      Maqsad
                    </th>
                    <th className="w-[72px] px-2 py-3.5"> </th>
                  </tr>
                </thead>
                <tbody>
                  {merged.map((entry) => {
                    if (entry.row === "debt") {
                      const d = entry.debt;
                      const dateLabel = new Intl.DateTimeFormat("uz-UZ", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }).format(d.lesson.lessonDate);
                      return (
                        <tr
                          key={`debt-${d.id}`}
                          className="border-b border-zinc-100/80 transition-colors last:border-0 hover:bg-amber-50/35"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-[var(--ink-soft)]">{dateLabel}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-amber-100/90 px-2.5 py-0.5 text-xs font-medium text-amber-950 ring-1 ring-amber-200/80">
                              Dars (kutilmoqda)
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-[var(--ink)]">
                            {formatSomUZS(d.amountSom)} so‘m
                          </td>
                          <td className="max-w-[160px] truncate px-4 py-3 text-[var(--ink-soft)]" title={d.lesson.teacher.fullName}>
                            <Link
                              href={`/teachers/${d.lesson.teacher.id}`}
                              className="font-medium text-violet-900 underline-offset-4 hover:underline"
                            >
                              №{d.lesson.teacher.listNumber} {d.lesson.teacher.fullName}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                              <span
                                className={cn(
                                  "inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1",
                                  "bg-amber-50 text-amber-950 ring-amber-200/90",
                                )}
                              >
                                To‘lanmadi
                              </span>
                              <form action={markGuardianFeePaid} className="inline">
                                <input type="hidden" name="lessonId" value={d.lessonId} />
                                <input type="hidden" name="studentId" value={studentId} />
                                <button
                                  type="submit"
                                  className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-[1.05]"
                                >
                                  To‘lov qilindi
                                </button>
                              </form>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-zinc-400">—</td>
                          <td className="max-w-[140px] truncate px-4 py-3 text-[var(--muted)]" title="Kelgan dars">
                            Kelgan dars
                          </td>
                          <td className="px-2 py-2"> </td>
                        </tr>
                      );
                    }

                    const p = entry.payment;
                    const paid = new Intl.DateTimeFormat("uz-UZ", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(p.paidAt);
                    return (
                      <tr
                        key={`pay-${p.id}`}
                        className="border-b border-zinc-100/80 transition-colors last:border-0 hover:bg-violet-50/40"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-[var(--ink-soft)]">{paid}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-zinc-100/90 px-2.5 py-0.5 text-xs font-medium text-zinc-800 ring-1 ring-zinc-200/70">
                            {paymentKindLabel(p.kind)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-[var(--ink)]">
                          {formatSomUZS(p.amountSom)} so‘m
                        </td>
                        <td className="max-w-[160px] truncate px-4 py-3 text-[var(--ink-soft)]">
                          <PaymentTeacherLink payment={p} primaryTeacher={primaryTeacher} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-200/80">
                            To‘landi (markaz yozuvi)
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[var(--ink-soft)]">
                          {paymentMethodLabel(p.method)}
                        </td>
                        <td className="max-w-[160px] truncate px-4 py-3 text-[var(--muted)]" title={p.description ?? ""}>
                          {p.description ?? "—"}
                        </td>
                        <td className="px-1 py-2">
                          <DeleteConfirmForm
                            action={deletePayment}
                            id={p.id}
                            displayName={`${formatSomUZS(p.amountSom)} so‘m · ${studentFullName}`}
                            entityLabel="To‘lovni"
                            redirectToStudentProfile
                            compact
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
