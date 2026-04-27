"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { CalendarDays, TrendingUp } from "lucide-react";

import { formatSomUZS } from "@/lib/format-currency";

export type TeacherLessonEarningRow = {
  lessonId: string;
  lessonDateIso: string;
  amountSom: number;
  student: {
    id: string;
    fullName: string;
  };
};

type TeacherLessonEarningsSectionProps = {
  rows: TeacherLessonEarningRow[];
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartIsoFromDateIso(dateIso: string) {
  const d = new Date(`${dateIso}T12:00:00.000Z`);
  d.setUTCDate(1);
  return d.toISOString().slice(0, 10);
}

function monthEndIsoFromDateIso(dateIso: string) {
  const d = new Date(`${dateIso}T12:00:00.000Z`);
  d.setUTCMonth(d.getUTCMonth() + 1, 0);
  return d.toISOString().slice(0, 10);
}

function formatDateIso(dateIso: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateIso}T12:00:00.000Z`));
}

export function TeacherLessonEarningsSection({ rows }: TeacherLessonEarningsSectionProps) {
  const [selectedDayIso, setSelectedDayIso] = useState(todayIso());
  const [selectedMonthIso, setSelectedMonthIso] = useState(() => monthStartIsoFromDateIso(todayIso()));

  const dailyRows = useMemo(() => {
    return rows
      .filter((r) => r.lessonDateIso === selectedDayIso)
      .sort((a, b) => a.student.fullName.localeCompare(b.student.fullName, "uz"));
  }, [rows, selectedDayIso]);

  const monthEndIso = useMemo(() => monthEndIsoFromDateIso(selectedMonthIso), [selectedMonthIso]);

  const monthlyRows = useMemo(() => {
    return rows.filter((r) => r.lessonDateIso >= selectedMonthIso && r.lessonDateIso <= monthEndIso);
  }, [rows, selectedMonthIso, monthEndIso]);

  const monthlyLessonsCount = monthlyRows.length;
  const monthlyShareSum = monthlyRows.reduce((sum, r) => sum + r.amountSom, 0);

  return (
    <section className="space-y-6 rounded-3xl border border-border bg-[color:var(--surface)] p-6 shadow-sm md:p-8">
      <header className="space-y-1">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--ink)]">
          <TrendingUp className="h-5 w-5 text-teal-600" aria-hidden />
          Darslar bo‘yicha ulush
        </h2>
        <p className="text-sm text-black">
          Kunlikda o‘quvchi va ulush ro‘yxati, oylikda esa o‘tgan darslar soni va jami ulush.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-zinc-100 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--ink)]">Kunlik darslar</h3>
            <label className="inline-flex items-center gap-2 text-xs text-black">
              <CalendarDays className="h-4 w-4" aria-hidden />
              <input
                type="date"
                value={selectedDayIso}
                onChange={(e) => setSelectedDayIso(e.target.value)}
                className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-[var(--ink)]"
              />
            </label>
          </div>
          {dailyRows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-black">
              {formatDateIso(selectedDayIso)} uchun dars yozuvi topilmadi.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-100">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-indigo-50">
                    <th className="px-3 py-2 font-semibold text-zinc-700">O‘quvchi</th>
                    <th className="px-3 py-2 font-semibold text-zinc-700">Ulush</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyRows.map((r) => (
                    <tr key={r.lessonId} className="border-b border-zinc-100 last:border-0">
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/students/${r.student.id}`}
                          className="font-medium text-teal-900 underline-offset-4 hover:underline"
                        >
                          {r.student.fullName}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 font-semibold tabular-nums text-teal-900">
                        {formatSomUZS(r.amountSom)} so‘m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-zinc-100 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--ink)]">Oylik hisobot</h3>
            <label className="inline-flex items-center gap-2 text-xs text-black">
              <CalendarDays className="h-4 w-4" aria-hidden />
              <input
                type="date"
                value={selectedMonthIso}
                onChange={(e) => setSelectedMonthIso(monthStartIsoFromDateIso(e.target.value))}
                className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-[var(--ink)]"
              />
            </label>
          </div>
          <p className="text-xs text-black">
            Oy oralig‘i: {formatDateIso(selectedMonthIso)} — {formatDateIso(monthEndIso)}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-teal-800">O‘tgan darslar</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-teal-950">{monthlyLessonsCount}</p>
            </div>
            <div className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-violet-800">Jami ulush</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-violet-950">
                {formatSomUZS(monthlyShareSum)}
              </p>
              <p className="text-xs text-violet-800">so‘m</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
