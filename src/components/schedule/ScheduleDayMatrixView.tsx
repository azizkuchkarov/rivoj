import Link from "next/link";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { LessonAttendanceTrigger } from "@/components/schedule/LessonAttendancePanel";
import type { LessonWithRelations } from "@/components/schedule/schedule-types";
import { ScheduleViewSwitcher } from "@/components/schedule/ScheduleViewSwitcher";
import { LessonAttendance, LessonGuardianFee, LessonKind } from "@/generated/prisma/enums";
import type { Teacher } from "@/generated/prisma/client";
import { cn } from "@/lib/cn";
import { SCHEDULE_CONSULTATION_PATH, SCHEDULE_LESSON_PATH } from "@/lib/schedule-paths";
import { addDaysUTC, toISODateStringUTC } from "@/lib/week-utils";
import { formatMinutesAsClock, formatSlotRangeLabel, getSlotStartMinutesList } from "@/lib/time-minutes";

type ScheduleDayMatrixViewProps = {
  variant?: "lesson" | "consultation";
  basePath?: string;
  day: Date;
  lessons: LessonWithRelations[];
  teachers: Pick<Teacher, "id" | "fullName" | "listNumber">[];
  weekMondayIso: string;
};

function lessonKey(teacherId: string, startMinutes: number) {
  return `${teacherId}:${startMinutes}`;
}

function buildLookup(lessons: LessonWithRelations[]) {
  const m = new Map<string, LessonWithRelations>();
  for (const L of lessons) {
    m.set(lessonKey(L.teacherId, L.startMinutes), L);
  }
  return m;
}

function dayLessonStatusStyle(L: LessonWithRelations) {
  if (L.attendance === LessonAttendance.PRESENT && L.guardianFee === LessonGuardianFee.PAID) {
    return {
      card: "border-emerald-300/90 bg-emerald-50/95",
      badge: "bg-emerald-200 text-emerald-950",
    };
  }
  if (L.attendance === LessonAttendance.PRESENT && L.guardianFee === LessonGuardianFee.UNPAID) {
    return {
      card: "border-red-300/90 bg-red-50/95",
      badge: "bg-red-200 text-red-950",
    };
  }
  return {
    card: "border-amber-300/90 bg-amber-50/95",
    badge: "bg-amber-200 text-amber-950",
  };
}

export function ScheduleDayMatrixView({
  variant = "lesson",
  basePath = SCHEDULE_LESSON_PATH,
  day,
  lessons,
  teachers,
  weekMondayIso,
}: ScheduleDayMatrixViewProps) {
  const isConsultation = variant === "consultation";
  const dayIso = toISODateStringUTC(day);
  const prevDay = toISODateStringUTC(addDaysUTC(day, -1));
  const nextDay = toISODateStringUTC(addDaysUTC(day, 1));
  const lookup = buildLookup(lessons);
  const slots = getSlotStartMinutesList();

  const title = new Intl.DateTimeFormat("uz-UZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(day);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)] md:text-3xl">
            {isConsultation ? "Konsultatsiya jadvali — kunlik" : "Dars jadvali — kunlik"}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            O‘qituvchilar (qatorlar) · dars va konsultatsiya alohida belgilanadi · soatlar (ustunlar) · {title}
          </p>
        </div>
        <div className="flex w-full min-w-0 flex-nowrap items-center justify-start gap-2 overflow-x-auto pb-0.5 lg:justify-end [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5">
          <ScheduleViewSwitcher
            active="day"
            weekMondayIso={weekMondayIso}
            dayIso={dayIso}
            basePath={basePath}
          />
          <Link
            href={`${basePath}?view=day&date=${prevDay}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-zinc-200 bg-white/90 px-3 py-2 text-sm font-medium text-[var(--ink-soft)] shadow-sm hover:bg-zinc-50"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Oldingi kun
          </Link>
          <Link
            href={`${basePath}?view=day&date=${nextDay}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-zinc-200 bg-white/90 px-3 py-2 text-sm font-medium text-[var(--ink-soft)] shadow-sm hover:bg-zinc-50"
          >
            Keyingi kun
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
          {basePath !== SCHEDULE_CONSULTATION_PATH ? (
            <Link
              href={`${basePath}/new`}
              className="shrink-0 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] px-5 py-2 text-sm font-semibold text-white shadow-md hover:brightness-[1.03]"
            >
              + Dars qo‘shish
            </Link>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/70 bg-[color:var(--surface)] shadow-lg shadow-black/5">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-teal-50/50">
              <th className="sticky left-0 z-30 min-w-[160px] border-r border-zinc-200 bg-teal-50/98 px-2 py-2 text-xs font-semibold uppercase tracking-wide text-teal-900">
                № · O‘qituvchi
              </th>
              {teachers.length === 0 ? (
                <th className="px-3 py-3 text-xs font-medium text-[var(--muted)]">
                  {isConsultation
                    ? "Konsultatsiya uchun belgilangan faol o‘qituvchi yo‘q — profilda «konsultatsiya»ni yoqing."
                    : "Faol o‘qituvchi yo‘q — avval o‘qituvchi qo‘shing."}
                </th>
              ) : (
                slots.map((slotStart) => (
                  <th
                    key={slotStart}
                    className="min-w-[92px] max-w-[110px] border-l border-zinc-100 px-1 py-2 text-center align-bottom"
                  >
                    <div className="text-[10px] font-semibold leading-tight text-[var(--ink)]">
                      {formatSlotRangeLabel(slotStart)}
                    </div>
                    <div className="mt-0.5 text-[9px] font-normal text-[var(--muted)]">
                      {formatMinutesAsClock(slotStart)}
                    </div>
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? null : (
              teachers.map((t) => (
                <tr key={t.id} className="border-b border-zinc-100/90 odd:bg-white/40 even:bg-zinc-50/30">
                  <td className="sticky left-0 z-10 border-r border-zinc-200 bg-white/95 px-2 py-2 align-middle text-xs font-semibold text-teal-900">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 inline-flex min-w-[2rem] justify-center rounded-md bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-teal-900 ring-1 ring-teal-200/80">
                        №{t.listNumber}
                      </span>
                      <Link href={`/teachers/${t.id}`} className="leading-snug hover:text-teal-950 hover:underline">
                        {t.fullName}
                      </Link>
                    </div>
                  </td>
                  {slots.map((slotStart) => {
                    const L = lookup.get(lessonKey(t.id, slotStart));
                    const isCon = L && L.kind === LessonKind.CONSULTATION;
                    const st = L ? dayLessonStatusStyle(L) : null;
                    return (
                      <td key={slotStart} className="min-h-[52px] border-l border-zinc-100/80 px-1 py-1 align-top">
                        {L ? (
                          <div
                            className={cn(
                              "rounded-lg border px-1.5 py-1 text-[10px] leading-snug shadow-sm",
                              isCon ? "border-violet-300/90 bg-violet-50/95" : st?.card,
                            )}
                          >
                            <LessonAttendanceTrigger lesson={L} label={L.student.fullName} />
                          </div>
                        ) : isConsultation ? (
                          <span className="flex min-h-[36px] items-center justify-center text-[10px] text-zinc-300">
                            —
                          </span>
                        ) : (
                          <Link
                            href={`${basePath}/new?lessonDate=${encodeURIComponent(dayIso)}&teacherId=${encodeURIComponent(t.id)}&startMinutes=${slotStart}`}
                            className="flex min-h-[40px] flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-teal-200/90 bg-teal-50/40 px-1 py-1 text-center text-[10px] font-medium text-teal-800 transition hover:border-teal-400 hover:bg-teal-100/70"
                          >
                            <span className="leading-none">+ Dars</span>
                            <span className="text-[9px] font-normal text-teal-700/80">qo‘shish</span>
                          </Link>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
