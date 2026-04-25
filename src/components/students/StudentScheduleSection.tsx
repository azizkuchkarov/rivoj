import Link from "next/link";

import { ArrowUpRight, CalendarClock, ChevronDown, Clock, ExternalLink } from "lucide-react";

import { LessonAttendance, LessonGuardianFee, LessonKind } from "@/generated/prisma/enums";
import { SCHEDULE_LESSON_PATH } from "@/lib/schedule-paths";
import { cn } from "@/lib/cn";
import { formatLessonRowDayUzUtc } from "@/lib/schedule-date-format";
import { formatMinutesAsClock } from "@/lib/time-minutes";

export type StudentProfileLesson = {
  id: string;
  lessonDate: Date;
  startMinutes: number;
  endMinutes: number;
  kind: LessonKind;
  attendance: LessonAttendance;
  guardianFee: LessonGuardianFee;
  teacher: { id: string; fullName: string; listNumber: number };
};

type StudentScheduleSectionProps = {
  lessons: StudentProfileLesson[];
};

const VISIBLE_DAY_COUNT = 2;

function groupLessonsByDay(lessons: StudentProfileLesson[]) {
  const map = new Map<string, StudentProfileLesson[]>();
  for (const L of lessons) {
    const iso = L.lessonDate.toISOString().slice(0, 10);
    if (!map.has(iso)) map.set(iso, []);
    map.get(iso)!.push(L);
  }
  const sortedKeys = [...map.keys()].sort();
  return sortedKeys.map((dayIso) => {
    const items = map.get(dayIso)!;
    items.sort((a, b) => a.startMinutes - b.startMinutes);
    return {
      dayIso,
      dayLabel: formatLessonRowDayUzUtc(items[0]!.lessonDate),
      items,
    };
  });
}

function guardianPaymentLabel(L: StudentProfileLesson) {
  if (L.attendance === LessonAttendance.UNMARKED) {
    return { text: "Rejada", className: "bg-zinc-100/90 text-zinc-700 ring-zinc-200/80" };
  }
  if (L.attendance === LessonAttendance.ABSENT) {
    return { text: "Kelmadi", className: "bg-zinc-200/80 text-zinc-700 ring-zinc-300/80" };
  }
  if (L.attendance === LessonAttendance.PRESENT) {
    if (L.guardianFee === LessonGuardianFee.PAID) {
      return { text: "To‘landi", className: "bg-emerald-100/95 text-emerald-950 ring-emerald-200/80" };
    }
    if (L.guardianFee === LessonGuardianFee.UNPAID) {
      return { text: "To‘lanmadi", className: "bg-amber-100/95 text-amber-950 ring-amber-200/80" };
    }
  }
  return { text: "—", className: "bg-zinc-50 text-zinc-500 ring-zinc-200/70" };
}

function LessonCard({ L, showDayHeading = true }: { L: StudentProfileLesson; showDayHeading?: boolean }) {
  const dayIso = L.lessonDate.toISOString().slice(0, 10);
  const dayLabel = formatLessonRowDayUzUtc(L.lessonDate);
  const timeRange = `${formatMinutesAsClock(L.startMinutes)}–${formatMinutesAsClock(L.endMinutes)}`;
  const isCon = L.kind === LessonKind.CONSULTATION;
  const gp = guardianPaymentLabel(L);
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm ring-1 transition sm:flex-row sm:items-center sm:justify-between",
        "border-zinc-100 ring-zinc-100 hover:border-indigo-200 hover:bg-indigo-50 hover:ring-indigo-200",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <div className="min-w-0">
            {showDayHeading ? (
              <p className="text-sm font-semibold leading-snug text-[var(--ink)]">{dayLabel}</p>
            ) : null}
            <div className={cn("flex flex-wrap items-center gap-2", showDayHeading && "mt-1.5")}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium tabular-nums text-zinc-800 ring-1 ring-zinc-200">
                <Clock className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
                {timeRange}
              </span>
              {isCon ? (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-900 ring-1 ring-violet-200/80">
                  Konsultatsiya
                </span>
              ) : (
                <span className="rounded-full bg-teal-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-900 ring-1 ring-teal-200/70">
                  Dars
                </span>
              )}
            </div>
          </div>
          <div className="min-w-0 sm:max-w-[min(100%,280px)]">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">O‘qituvchi</p>
            <Link
              href={`/teachers/${L.teacher.id}`}
              className="mt-0.5 block truncate font-medium text-violet-900 underline-offset-4 hover:underline"
            >
              №{L.teacher.listNumber} {L.teacher.fullName}
            </Link>
          </div>
          <div className="min-w-0 sm:max-w-[140px]">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Ota-ona to‘lovi</p>
            <span
              className={cn(
                "mt-1.5 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
                gp.className,
              )}
            >
              {gp.text}
            </span>
          </div>
        </div>
      </div>
      <Link
        href={`${SCHEDULE_LESSON_PATH}?view=day&date=${dayIso}`}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-full border border-teal-200/80 bg-teal-50/80 px-4 py-2 text-xs font-semibold text-teal-900 transition hover:bg-teal-100/90 sm:self-center"
      >
        Jadvalda ochish
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </div>
  );
}

export function StudentScheduleSection({ lessons }: StudentScheduleSectionProps) {
  const byDay = groupLessonsByDay(lessons);
  const visibleGroups = byDay.slice(0, VISIBLE_DAY_COUNT);
  const hiddenGroups = byDay.slice(VISIBLE_DAY_COUNT);
  const hiddenLessonTotal = hiddenGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-border bg-white p-[1px] shadow-sm">
      <div className="relative rounded-[1.7rem] bg-[color:var(--surface)] px-5 py-6 md:px-8 md:py-7">

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200 shadow-inner">
              <CalendarClock className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-800">Reja</p>
              <h2 className="font-display text-xl font-semibold tracking-tight text-[var(--ink)] md:text-2xl">
                Dars jadvali
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-[var(--muted)]">
                Bugundan boshlab belgilangan darslar. Markaz bo‘limida barcha o‘qituvchilar jadvalini ko‘rasiz.
              </p>
            </div>
          </div>
          <Link
            href={SCHEDULE_LESSON_PATH}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full border border-indigo-200 bg-white px-5 py-2.5 text-sm font-semibold text-indigo-900 shadow-sm ring-1 ring-indigo-100 transition hover:border-indigo-300 hover:bg-indigo-50"
          >
            Umumiy jadval
            <ExternalLink className="h-4 w-4 opacity-70" aria-hidden />
          </Link>
        </div>

        {lessons.length === 0 ? (
          <div className="relative mt-8 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50 px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200">
              <CalendarClock className="h-7 w-7 opacity-90" aria-hidden />
            </div>
            <p className="mt-5 font-medium text-[var(--ink)]">Kelajakdagi darslar hozircha yo‘q</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Yangi dars qo‘shish bilan shu yerda ro‘yxat paydo bo‘ladi.</p>
            <Link
              href="/schedule/new"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-900/15 transition hover:brightness-[1.03]"
            >
              Yangi dars qo‘shish
            </Link>
          </div>
        ) : (
          <div className="relative mt-8 space-y-8">
            {visibleGroups.map((group) => (
              <div key={group.dayIso} className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-800">{group.dayLabel}</p>
                <ul className="space-y-3">
                  {group.items.map((L) => (
                    <li key={L.id}>
                      <LessonCard L={L} showDayHeading={false} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {hiddenGroups.length > 0 ? (
              <details className="group rounded-2xl border border-indigo-200 bg-indigo-50 ring-1 ring-indigo-100 open:bg-indigo-100">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-indigo-950 transition hover:bg-indigo-100 [&::-webkit-details-marker]:hidden">
                  <span>
                    Boshqa kunlar{" "}
                    <span className="font-medium text-indigo-800">
                      ({hiddenGroups.length} kun · {hiddenLessonTotal} dars)
                    </span>
                  </span>
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-indigo-700 transition duration-200 group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="space-y-6 border-t border-indigo-100 px-4 pb-4 pt-2">
                  {hiddenGroups.map((group) => (
                    <div key={group.dayIso} className="space-y-3 pt-2 first:pt-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-800">{group.dayLabel}</p>
                      <ul className="space-y-3">
                        {group.items.map((L) => (
                          <li key={L.id}>
                            <LessonCard L={L} showDayHeading={false} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
