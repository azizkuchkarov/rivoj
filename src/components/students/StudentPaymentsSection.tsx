import Link from "next/link";

import { AlertTriangle, Banknote, CreditCard, Sparkles } from "lucide-react";

import { markGuardianFeePaid } from "@/app/students/actions";
import { deletePayment } from "@/app/payments/actions";
import { DeleteConfirmForm } from "@/components/common/DeleteConfirmForm";
import { formatSomUZS } from "@/lib/format-currency";
import { paymentKindLabel, paymentMethodLabel } from "@/lib/payment-labels";
import type { Payment, Teacher } from "@/generated/prisma/client";
import { LessonAttendance, LessonGuardianFee } from "@/generated/prisma/enums";
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
    lessonDate: Date;
    startMinutes: number;
    attendance: LessonAttendance;
    guardianFee: LessonGuardianFee;
    teacher: { id: string; fullName: string; listNumber: number };
  } | null;
};

function paymentStatusBadge(payment: PaymentWithTeacher) {
  if (payment.kind === "SUBSCRIPTION") {
    return (
      <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-900 ring-1 ring-indigo-200">
        To‘landi (abonentlik)
      </span>
    );
  }
  if (payment.lesson?.attendance === LessonAttendance.PRESENT && payment.lesson.guardianFee === LessonGuardianFee.UNPAID) {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-950 ring-1 ring-amber-200">
        To‘lanmadi
      </span>
    );
  }
  if (payment.lesson?.attendance === LessonAttendance.PRESENT && payment.lesson.guardianFee === LessonGuardianFee.PAID) {
    return (
      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-200">
        To‘landi
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-800 ring-1 ring-zinc-200">
      Kutilmoqda
    </span>
  );
}

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

function formatClock(startMinutes: number): string {
  const h = Math.floor(startMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (startMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
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
  const sortedPayments = [...payments].sort(
    (a, b) =>
      new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime() ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const sortedDebts = [...guardianDebts].sort(
    (a, b) => b.lesson.lessonDate.getTime() - a.lesson.lessonDate.getTime(),
  );
  const paidSectionPayments = sortedPayments.filter((p) => {
    if (!p.lesson) return true;
    return !(
      p.lesson.attendance === LessonAttendance.PRESENT &&
      p.lesson.guardianFee === LessonGuardianFee.UNPAID
    );
  });
  const hasRows = sortedPayments.length > 0 || sortedDebts.length > 0;

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-border bg-white p-[1px] shadow-sm">
      <div className="relative rounded-[1.7rem] bg-[color:var(--surface)] px-5 py-6 md:px-8 md:py-7">

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200 shadow-inner">
              <Banknote className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-800">Hisob</p>
              <h2 className="font-display text-xl font-semibold tracking-tight text-[var(--ink)] md:text-2xl">
                To‘lovlar
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-black">
                To‘lovlar ikki bo‘limda: «To‘lov qilinganlar» va «Qarzdorlik». Bir martalik (kunlik) to‘lov bilan
                5-6 ta dars qo‘shilsa ham har biri alohida qatorda ko‘rinadi.
              </p>
            </div>
          </div>
          <Link
            href={`/payments?studentId=${studentId}`}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full border border-indigo-200 bg-white px-5 py-2.5 text-sm font-semibold text-indigo-900 shadow-sm ring-1 ring-indigo-100 transition hover:border-indigo-300 hover:bg-indigo-50"
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
          <div className="relative mt-8 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200">
              <Banknote className="h-7 w-7 opacity-90" aria-hidden />
            </div>
            <p className="mt-5 font-medium text-[var(--ink)]">Hozircha yozuvlar yo‘q</p>
            <p className="mt-2 text-sm text-black">
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
          <div className="relative mt-8 space-y-6">
            <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white">
              <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-emerald-900">
                  To‘lov qilinganlar ({paidSectionPayments.length} ta)
                </h3>
              </div>
              {paidSectionPayments.length === 0 ? (
                <p className="px-4 py-6 text-sm text-black">Hozircha to‘lov qilingan darslar yo‘q.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50">
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">Sana</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">Dars vaqti</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">To‘lov turi</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">Summa</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">O‘qituvchi</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">Usul</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">Holat</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">Maqsad</th>
                        <th className="w-[72px] px-2 py-3"> </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paidSectionPayments.map((p) => {
                        const paid = new Intl.DateTimeFormat("uz-UZ", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(p.paidAt);
                        const lessonWhen = p.lesson
                          ? `${new Intl.DateTimeFormat("uz-UZ", {
                              day: "numeric",
                              month: "short",
                            }).format(p.lesson.lessonDate)} · ${formatClock(p.lesson.startMinutes)}`
                          : "—";
                        return (
                          <tr
                            key={`pay-${p.id}`}
                            className="border-b border-zinc-100 transition-colors last:border-0 hover:bg-emerald-50"
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-[var(--ink-soft)]">{paid}</td>
                            <td className="whitespace-nowrap px-4 py-3 text-[var(--ink-soft)]">{lessonWhen}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 ring-1 ring-zinc-200">
                                {paymentKindLabel(p.kind)}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-[var(--ink)]">
                              {formatSomUZS(p.amountSom)} so‘m
                            </td>
                            <td className="max-w-[170px] truncate px-4 py-3 text-[var(--ink-soft)]">
                              <PaymentTeacherLink payment={p} primaryTeacher={primaryTeacher} />
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-[var(--ink-soft)]">
                              {paymentMethodLabel(p.method)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">{paymentStatusBadge(p)}</td>
                            <td className="max-w-[180px] truncate px-4 py-3 text-black" title={p.description ?? ""}>
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
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white">
              <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-amber-900">
                  Qarzdorlik (darsga kelib, to‘lov qilmagan) ({sortedDebts.length} ta)
                </h3>
              </div>
              {sortedDebts.length === 0 ? (
                <p className="px-4 py-6 text-sm text-black">Qarzdorlik yo‘q.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50">
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">Sana</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">Dars</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">Qarz summasi</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">O‘qituvchi</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">Holat</th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">Amal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDebts.map((d) => {
                        const dateLabel = new Intl.DateTimeFormat("uz-UZ", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(d.lesson.lessonDate);
                        return (
                          <tr
                            key={`debt-${d.id}`}
                            className="border-b border-zinc-100 transition-colors last:border-0 hover:bg-amber-50"
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-[var(--ink-soft)]">{dateLabel}</td>
                            <td className="px-4 py-3 text-[var(--ink-soft)]">Kelgan dars</td>
                            <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-[var(--ink)]">
                              {formatSomUZS(d.amountSom)} so‘m
                            </td>
                            <td className="max-w-[180px] truncate px-4 py-3 text-[var(--ink-soft)]" title={d.lesson.teacher.fullName}>
                              <Link
                                href={`/teachers/${d.lesson.teacher.id}`}
                                className="font-medium text-violet-900 underline-offset-4 hover:underline"
                              >
                                №{d.lesson.teacher.listNumber} {d.lesson.teacher.fullName}
                              </Link>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-950 ring-1 ring-amber-200">
                                To‘lanmadi
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <form action={markGuardianFeePaid} className="inline">
                                <input type="hidden" name="lessonId" value={d.lessonId} />
                                <input type="hidden" name="studentId" value={studentId} />
                                <button
                                  type="submit"
                                  className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-[1.05]"
                                >
                                  To‘lov qilindi
                                </button>
                              </form>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
