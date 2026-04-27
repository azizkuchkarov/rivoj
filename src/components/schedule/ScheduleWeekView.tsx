"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ChevronDown, Trash2 } from "lucide-react";

import { deleteLesson } from "@/app/schedule/actions";
import { LessonAttendanceTrigger } from "@/components/schedule/LessonAttendancePanel";
import type { LessonWithRelations } from "@/components/schedule/schedule-types";
import { ScheduleViewSwitcher } from "@/components/schedule/ScheduleViewSwitcher";
import { LessonKind } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";
import { SCHEDULE_CONSULTATION_PATH, SCHEDULE_LESSON_PATH } from "@/lib/schedule-paths";
import {
  formatLessonRowDayUzUtc,
  formatScheduleColumnHeadUtc,
  formatWeekRangeLabelUtc,
} from "@/lib/schedule-date-format";
import { addDaysUTC, parseDayParam, toISODateStringUTC } from "@/lib/week-utils";
import { formatMinutesAsClock, getSlotStartMinutesList } from "@/lib/time-minutes";

type ScheduleWeekViewProps = {
  weekMonday: Date;
  lessons: LessonWithRelations[];
  variant?: "lesson" | "consultation";
  basePath?: string;
};

function groupByDay(lessons: LessonWithRelations[], weekMonday: Date) {
  const keys: string[] = [];
  for (let i = 0; i < 7; i++) {
    keys.push(toISODateStringUTC(addDaysUTC(weekMonday, i)));
  }
  const map = new Map<string, LessonWithRelations[]>();
  for (const k of keys) map.set(k, []);
  for (const L of lessons) {
    const k = L.lessonDate.toISOString().slice(0, 10);
    const arr = map.get(k);
    if (arr) arr.push(L);
  }
  return { keys, map };
}

/** Kun + slot bo‘yicha barcha darslar (bir vaqtda bir nechta) */
function buildDaySlotLookup(
  dayLessons: LessonWithRelations[],
  slotStarts: number[],
): Map<number, LessonWithRelations[]> {
  const m = new Map<number, LessonWithRelations[]>();
  for (const s of slotStarts) m.set(s, []);
  for (const L of dayLessons) {
    if (!m.has(L.startMinutes)) continue;
    const arr = m.get(L.startMinutes)!;
    arr.push(L);
  }
  for (const [, arr] of m) {
    arr.sort((a, b) => a.teacher.fullName.localeCompare(b.teacher.fullName, "uz"));
  }
  return m;
}

function lessonColor(teacherId: string) {
  let h = 0;
  for (let i = 0; i < teacherId.length; i++) h = (h + teacherId.charCodeAt(i) * (i + 1)) % 360;
  return `hsl(${h} 55% 90%)`;
}

function LessonMiniCard({
  L,
  weekMondayIso,
  basePath,
}: {
  L: LessonWithRelations;
  weekMondayIso: string;
  basePath: string;
}) {
  const isCon = L.kind === LessonKind.CONSULTATION;
  const kindLabel = isCon ? "Kons." : "Dars";
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-md border px-1 py-0.5 text-[9px] leading-tight",
        isCon ? "border-violet-400" : "border-amber-400",
      )}
      style={{
        background: isCon
          ? "color-mix(in srgb, hsl(270 50% 88%) 85%, transparent)"
          : lessonColor(L.teacherId),
      }}
      title={`${formatMinutesAsClock(L.startMinutes)}–${formatMinutesAsClock(L.endMinutes)} · №${L.teacher.listNumber} ${L.teacher.fullName} · ${L.student.fullName}`}
    >
      <div className="mb-0.5 flex items-center gap-0.5">
        <span
          className={cn(
            "shrink-0 rounded px-0.5 text-[6px] font-bold uppercase text-white",
            isCon ? "bg-violet-600" : "bg-amber-600",
          )}
        >
          {kindLabel}
        </span>
      </div>
      <div className="truncate font-semibold text-[var(--ink)]">
        №{L.teacher.listNumber} {L.teacher.fullName}
      </div>
      <div className="truncate text-zinc-700">{L.student.fullName}</div>
      <LessonAttendanceTrigger lesson={L} />
      <form action={deleteLesson} className="mt-0.5">
        <input type="hidden" name="lessonId" value={L.id} />
        <input type="hidden" name="scheduleView" value="week" />
        <input type="hidden" name="week" value={weekMondayIso} />
        <input type="hidden" name="returnBase" value={basePath} />
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-0.5 rounded bg-white py-0.5 text-[8px] font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-50"
          aria-label={isCon ? "Konsultatsiyani o‘chirish" : "Darsni o‘chirish"}
        >
          <Trash2 className="h-2 w-2" aria-hidden />
        </button>
      </form>
    </div>
  );
}

export function ScheduleWeekView({
  weekMonday,
  lessons,
  variant = "lesson",
  basePath = SCHEDULE_LESSON_PATH,
}: ScheduleWeekViewProps) {
  const { keys, map } = groupByDay(lessons, weekMonday);
  const prev = toISODateStringUTC(addDaysUTC(weekMonday, -7));
  const next = toISODateStringUTC(addDaysUTC(weekMonday, 7));
  const weekMondayIso = toISODateStringUTC(weekMonday);
  const todayIso = toISODateStringUTC(parseDayParam(undefined));
  const isConsultation = variant === "consultation";
  const slotStarts = useMemo(() => getSlotStartMinutesList(), []);
  const showAddLinks = !isConsultation && basePath !== SCHEDULE_CONSULTATION_PATH;

  const [expandedSlot, setExpandedSlot] = useState<number | null>(null);
  const [expandedCell, setExpandedCell] = useState<string | null>(null);

  const rangeLabel = formatWeekRangeLabelUtc(weekMonday);

  const lessonsAtExpandedSlot = useMemo(() => {
    if (expandedSlot === null) return [];
    return lessons
      .filter((L) => L.startMinutes === expandedSlot)
      .sort(
        (a, b) =>
          a.lessonDate.toISOString().localeCompare(b.lessonDate.toISOString()) ||
          a.teacher.fullName.localeCompare(b.teacher.fullName, "uz"),
      );
  }, [lessons, expandedSlot]);

  const countBySlot = useMemo(() => {
    const c = new Map<number, number>();
    for (const s of slotStarts) c.set(s, 0);
    for (const L of lessons) {
      if (c.has(L.startMinutes)) c.set(L.startMinutes, (c.get(L.startMinutes) ?? 0) + 1);
    }
    return c;
  }, [lessons, slotStarts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)] md:text-3xl">
            {isConsultation ? "Konsultatsiya jadvali — haftalik" : "Dars jadvali — haftalik"}
          </h1>
          <p className="mt-1 text-sm text-black">
            Ustunda kunlar, qatorda soatlar. Bir vaqtda bir nechta dars — kataklarda ro‘yxat. Chapdagi soatni bosing —
            shu vaqt bo‘yicha haftadagi barcha darslar ochiladi. {rangeLabel}
          </p>
        </div>
        <div className="flex w-full min-w-0 flex-nowrap items-center justify-start gap-2 overflow-x-auto pb-0.5 lg:justify-end [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5">
          <ScheduleViewSwitcher
            active="week"
            weekMondayIso={weekMondayIso}
            dayIso={todayIso}
            basePath={basePath}
          />
          <Link
            href={`${basePath}?view=week&week=${prev}`}
            className="shrink-0 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-[var(--ink-soft)] hover:bg-zinc-50"
          >
            ← Oldingi hafta
          </Link>
          <Link
            href={`${basePath}?view=week&week=${next}`}
            className="shrink-0 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-[var(--ink-soft)] hover:bg-zinc-50"
          >
            Keyingi hafta →
          </Link>
          {basePath !== SCHEDULE_CONSULTATION_PATH ? (
            <Link
              href={`${basePath}/new`}
              className="shrink-0 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-[1.03]"
            >
              + Dars qo‘shish
            </Link>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-[color:var(--surface)] p-2 md:p-3">
        <div
          className="grid min-w-[720px] gap-0.5"
          style={{
            gridTemplateColumns: `88px repeat(7, minmax(96px, 1fr))`,
            gridTemplateRows: `auto repeat(${slotStarts.length}, minmax(56px, auto))`,
          }}
        >
          <div className="rounded-tl-lg bg-indigo-50 px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-indigo-900">
            Vaqt
          </div>
          {keys.map((dayKey, idx) => {
            const dayDate = addDaysUTC(weekMonday, idx);
            const head = formatScheduleColumnHeadUtc(dayKey);
            return (
              <div
                key={dayKey}
                className="border-b border-zinc-100 bg-indigo-50 px-1 py-2 text-center text-[10px] font-semibold text-indigo-900"
              >
                <Link
                  href={`${basePath}?view=day&date=${toISODateStringUTC(dayDate)}`}
                  className="hover:text-teal-950 hover:underline"
                >
                  {head}
                </Link>
              </div>
            );
          })}

          {slotStarts.map((slotStart) => {
            const totalThisHour = countBySlot.get(slotStart) ?? 0;
            const isOpen = expandedSlot === slotStart;

            return (
              <div key={slotStart} className="contents">
                <div className="flex flex-col justify-center border-b border-r border-zinc-100 bg-zinc-50 px-1 py-1">
                  <button
                    type="button"
                    onClick={() => setExpandedSlot(isOpen ? null : slotStart)}
                    className={cn(
                      "flex w-full items-center justify-between gap-1 rounded-lg px-1.5 py-1.5 text-left text-[11px] font-semibold transition",
                      isOpen
                        ? "bg-teal-600 text-white"
                        : "bg-white text-teal-900 ring-1 ring-teal-100 hover:bg-teal-50",
                    )}
                    aria-expanded={isOpen}
                    title="Bosib, shu vaqt bo‘yicha haftadagi barcha darslarni oching / yoping"
                  >
                    <span className="tabular-nums">{formatMinutesAsClock(slotStart)}</span>
                    <span className="flex items-center gap-0.5">
                      {totalThisHour > 0 ? (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums",
                            isOpen ? "bg-white text-teal-900" : "bg-teal-100 text-teal-900",
                          )}
                        >
                          {totalThisHour}
                        </span>
                      ) : null}
                      <ChevronDown
                        className={cn("h-3.5 w-3.5 shrink-0 transition", isOpen && "rotate-180")}
                        aria-hidden
                      />
                    </span>
                  </button>
                </div>

                {keys.map((dayKey) => {
                  const dayLessons = map.get(dayKey) ?? [];
                  const lookup = buildDaySlotLookup(dayLessons, slotStarts);
                  const atSlot = lookup.get(slotStart) ?? [];
                  const cellKey = `${dayKey}|${slotStart}`;
                  const cellOpen = expandedCell === cellKey;

                  return (
                    <div
                      key={`${dayKey}-${slotStart}`}
                      className="flex flex-col gap-1 border-b border-zinc-100 bg-white p-1"
                    >
                      {atSlot.length === 0 && showAddLinks ? (
                        <Link
                          href={`${basePath}/new?lessonDate=${encodeURIComponent(dayKey)}&startMinutes=${slotStart}`}
                          className="flex min-h-[40px] flex-1 items-center justify-center rounded-md border border-dashed border-teal-200 bg-teal-50 text-[10px] font-medium text-teal-700 transition hover:border-teal-400 hover:bg-teal-100"
                        >
                          + Qoʻshish
                        </Link>
                      ) : null}
                      {atSlot.length > 0 ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setExpandedCell(cellOpen ? null : cellKey)}
                            className={cn(
                              "flex min-h-[40px] w-full items-center justify-center rounded-md border px-2 py-1 text-[10px] font-semibold transition",
                              cellOpen
                                ? "border-teal-300 bg-teal-100 text-teal-950"
                                : "border-teal-200 bg-teal-50 text-teal-800 hover:border-teal-400 hover:bg-teal-100",
                            )}
                          >
                            {atSlot.length} ta dars
                          </button>
                          {cellOpen ? (
                            <div className="max-h-40 overflow-y-auto rounded-md border border-zinc-200 bg-white p-1.5">
                              <ul className="space-y-1">
                                {atSlot.map((L) => (
                                  <li
                                    key={L.id}
                                    className="rounded border border-zinc-100 bg-zinc-50 px-1.5 py-1 text-[10px] leading-tight text-[var(--ink)]"
                                  >
                                    <span className="font-semibold">{L.student.fullName}</span>
                                    <span className="text-zinc-400"> · </span>
                                    <span>№{L.teacher.listNumber} {L.teacher.fullName}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {expandedSlot !== null ? (
          <div
            className="mt-3 rounded-xl border border-teal-200 bg-teal-50 p-4"
            role="region"
            aria-label={`${formatMinutesAsClock(expandedSlot)} vaqti bo‘yicha darslar`}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-teal-950">
                {formatMinutesAsClock(expandedSlot)} — haftadagi barcha darslar
                <span className="ml-2 font-normal text-teal-800">({lessonsAtExpandedSlot.length} ta)</span>
              </h2>
              <button
                type="button"
                onClick={() => setExpandedSlot(null)}
                className="text-xs font-medium text-teal-800 underline-offset-4 hover:underline"
              >
                Yopish
              </button>
            </div>
            {lessonsAtExpandedSlot.length === 0 ? (
              <p className="text-sm text-teal-900">Bu vaqt uchun yozuv yo‘q.</p>
            ) : (
              <ul className="space-y-2">
                {lessonsAtExpandedSlot.map((L) => {
                  const dayIso = L.lessonDate.toISOString().slice(0, 10);
                  const dayLabel = formatLessonRowDayUzUtc(L.lessonDate);
                  const isCon = L.kind === LessonKind.CONSULTATION;
                  return (
                    <li
                      key={L.id}
                      className="flex flex-col gap-2 rounded-lg border border-zinc-100 bg-white px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="font-medium text-[var(--ink)]">{dayLabel}</p>
                        <p className="text-xs text-black">
                          {formatMinutesAsClock(L.startMinutes)}–{formatMinutesAsClock(L.endMinutes)}
                          {isCon ? (
                            <span className="ml-2 rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-900">
                              Konsultatsiya
                            </span>
                          ) : (
                            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-950">
                              Dars
                            </span>
                          )}
                        </p>
                        <p className="text-[var(--ink-soft)]">
                          <span className="font-semibold text-teal-900">№{L.teacher.listNumber}</span>{" "}
                          {L.teacher.fullName}
                          <span className="text-zinc-400"> · </span>
                          {L.student.fullName}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <LessonAttendanceTrigger lesson={L} compact />
                        <Link
                          href={`${basePath}?view=day&date=${dayIso}`}
                          className="rounded-full border border-teal-200 px-3 py-1 text-xs font-medium text-teal-900 hover:bg-teal-50"
                        >
                          Kunlik jadval
                        </Link>
                        <form action={deleteLesson}>
                          <input type="hidden" name="lessonId" value={L.id} />
                          <input type="hidden" name="scheduleView" value="week" />
                          <input type="hidden" name="week" value={weekMondayIso} />
                          <input type="hidden" name="returnBase" value={basePath} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" aria-hidden />
                            O‘chirish
                          </button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
