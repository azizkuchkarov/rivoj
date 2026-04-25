import Link from "next/link";

import { AlertTriangle } from "lucide-react";

import { DbUnavailable } from "@/components/teachers/DbUnavailable";
import { LessonAttendance, LessonGuardianFee, LessonKind } from "@/generated/prisma/enums";
import { formatSomUZS } from "@/lib/format-currency";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type DebtRow = {
  lessonId: string;
  amountSom: number;
  kind: "DAILY" | "SUBSCRIPTION";
  lessonDate: Date;
  startMinutes: number;
  student: { id: string; fullName: string };
  teacher: { id: string; fullName: string; listNumber: number };
};

function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export default async function DebtorsPage() {
  let rows: DebtRow[] = [];
  let totalSom = 0;
  try {
    const [dailyDebts, subscriptionDebts] = await Promise.all([
      prisma.studentDebt.findMany({
        select: {
          amountSom: true,
          lessonId: true,
          lesson: {
            select: {
              lessonDate: true,
              startMinutes: true,
              student: { select: { id: true, fullName: true } },
              teacher: { select: { id: true, fullName: true, listNumber: true } },
              consumedSubscriptionPaymentId: true,
            },
          },
        },
        orderBy: [{ lesson: { lessonDate: "asc" } }, { lesson: { startMinutes: "asc" } }],
      }),
      prisma.lesson.findMany({
        where: {
          attendance: LessonAttendance.PRESENT,
          guardianFee: LessonGuardianFee.NA,
          consumedSubscriptionPaymentId: null,
          settlementSom: { gt: 0 },
          kind: LessonKind.LESSON,
        },
        select: {
          id: true,
          settlementSom: true,
          lessonDate: true,
          startMinutes: true,
          student: { select: { id: true, fullName: true } },
          teacher: { select: { id: true, fullName: true, listNumber: true } },
        },
        orderBy: [{ lessonDate: "asc" }, { startMinutes: "asc" }],
      }),
    ]);

    const base: DebtRow[] = dailyDebts.map((d) => ({
      lessonId: d.lessonId,
      amountSom: d.amountSom,
      kind: d.lesson.consumedSubscriptionPaymentId ? "SUBSCRIPTION" : "DAILY",
      lessonDate: d.lesson.lessonDate,
      startMinutes: d.lesson.startMinutes,
      student: d.lesson.student,
      teacher: d.lesson.teacher,
    }));

    const existingLessonIds = new Set(base.map((x) => x.lessonId));
    const subExtra: DebtRow[] = subscriptionDebts
      .filter((l) => !existingLessonIds.has(l.id))
      .map((l) => ({
        lessonId: l.id,
        amountSom: l.settlementSom ?? 0,
        kind: "SUBSCRIPTION",
        lessonDate: l.lessonDate,
        startMinutes: l.startMinutes,
        student: l.student,
        teacher: l.teacher,
      }));

    rows = [...base, ...subExtra].sort(
      (a, b) => a.lessonDate.getTime() - b.lessonDate.getTime() || a.startMinutes - b.startMinutes,
    );
    totalSom = rows.reduce((sum, r) => sum + r.amountSom, 0);
  } catch {
    return <DbUnavailable />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-900 ring-1 ring-amber-200">
              <AlertTriangle className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-semibold text-amber-950 md:text-2xl">Qarzdorlar ro‘yxati</h1>
              <p className="mt-1 text-sm text-amber-900">Ota-ona to‘lovi qilinmagan darslar (bir martalik va abonentlik).</p>
            </div>
          </div>
          <div className="shrink-0 rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-900">
            Jami qarz: {formatSomUZS(totalSom)} so‘m
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-white">
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[var(--muted)]">Hozircha qarzdorlar yo‘q.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">Sana</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">Vaqt</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">O‘quvchi</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">O‘qituvchi</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">To‘lov turi</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">Qarz summasi</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-700">Profil</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const dateLabel = new Intl.DateTimeFormat("uz-UZ", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }).format(row.lessonDate);
                  return (
                    <tr key={row.lessonId} className="border-b border-zinc-100 last:border-0 hover:bg-amber-50/40">
                      <td className="whitespace-nowrap px-4 py-3 text-[var(--ink-soft)]">{dateLabel}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-[var(--ink-soft)]">{formatClock(row.startMinutes)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/students/${row.student.id}`} className="font-medium text-violet-900 underline-offset-4 hover:underline">
                          {row.student.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[var(--ink-soft)]">
                        <Link href={`/teachers/${row.teacher.id}`} className="font-medium text-violet-900 underline-offset-4 hover:underline">
                          №{row.teacher.listNumber} {row.teacher.fullName}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {row.kind === "SUBSCRIPTION" ? (
                          <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-900 ring-1 ring-indigo-200">
                            Abonentlik
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-950 ring-1 ring-amber-200">
                            Bir martalik
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-[var(--ink)]">
                        {formatSomUZS(row.amountSom)} so‘m
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/students/${row.student.id}`}
                          className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-900 hover:bg-indigo-100"
                        >
                          Ochish
                        </Link>
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
  );
}
