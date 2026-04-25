"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import { Loader2 } from "lucide-react";

import {
  getTeacherDayScheduleForIntake,
  registerConsultationIntake,
  type TeacherDayBlock,
} from "@/app/konsultatsiya/actions";
import type { Teacher } from "@/generated/prisma/client";
import { cn } from "@/lib/cn";
import { LESSON_DURATION_MINUTES } from "@/lib/schedule-config";
import { formatMinutesAsClock, formatSlotRangeLabel, getSlotStartMinutesList } from "@/lib/time-minutes";

type ConsultationIntakeFormProps = {
  teachers: Pick<Teacher, "id" | "fullName" | "listNumber" | "isActive">[];
  defaultDate: string;
};

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart;
}

export function ConsultationIntakeForm({ teachers, defaultDate }: ConsultationIntakeFormProps) {
  const [state, formAction, pending] = useActionState(registerConsultationIntake, {});
  const [teacherId, setTeacherId] = useState("");
  const [lessonDate, setLessonDate] = useState(defaultDate);
  const [blocks, setBlocks] = useState<TeacherDayBlock[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [selectedStart, setSelectedStart] = useState<number | null>(null);

  const slots = useMemo(() => getSlotStartMinutesList(), []);
  const activeTeachers = useMemo(
    () => [...teachers].filter((t) => t.isActive).sort((a, b) => a.listNumber - b.listNumber || a.fullName.localeCompare(b.fullName)),
    [teachers],
  );

  useEffect(() => {
    if (!teacherId || !lessonDate) {
      setBlocks([]);
      return;
    }
    let cancelled = false;
    setLoadingSchedule(true);
    setLoadErr(null);
    void getTeacherDayScheduleForIntake(teacherId, lessonDate).then((res) => {
      if (cancelled) return;
      setLoadingSchedule(false);
      if (res.ok) {
        setBlocks(res.blocks);
      } else {
        setLoadErr(res.error);
        setBlocks([]);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [teacherId, lessonDate]);

  const freeSlots = useMemo(() => {
    return slots.filter((start) => {
      const end = start + LESSON_DURATION_MINUTES;
      return !blocks.some((b) => rangesOverlap(start, end, b.startMinutes, b.endMinutes));
    });
  }, [slots, blocks]);

  useEffect(() => {
    setSelectedStart((prev) => {
      if (prev === null) return null;
      const end = prev + LESSON_DURATION_MINUTES;
      const busy = blocks.some((b) => rangesOverlap(prev, end, b.startMinutes, b.endMinutes));
      return busy ? null : prev;
    });
  }, [blocks]);

  return (
    <form action={formAction} className="space-y-8">
      {state.error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900"
        >
          {state.error}
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--ink)]">1. Yangi o‘quvchi</h2>
        <p className="text-sm text-[var(--muted)]">
          Konsultatsiyaga kelgan har bir bola uchun yangi kartochka yaratiladi.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="fullName">
              To‘liq ism <span className="text-red-500">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              required
              className="w-full rounded-2xl border border-zinc-200/90 bg-white/80 px-4 py-3"
              placeholder="Masalan: Ali Valiyev"
              autoComplete="name"
            />
            {state.fieldErrors?.fullName ? (
              <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.fullName}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="guardianPhone">
              Vasiy telefoni
            </label>
            <input
              id="guardianPhone"
              name="guardianPhone"
              type="tel"
              className="w-full rounded-2xl border border-zinc-200/90 bg-white/80 px-4 py-3"
              placeholder="+998 …"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="guardianName">
              Vasiy ismi
            </label>
            <input
              id="guardianName"
              name="guardianName"
              className="w-full rounded-2xl border border-zinc-200/90 bg-white/80 px-4 py-3"
              placeholder="Ixtiyoriy"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--ink)]">2. Konsultatsiya o‘qituvchisi va sana</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-1">
            <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="lessonDate">
              Sana <span className="text-red-500">*</span>
            </label>
            <input
              id="lessonDate"
              name="lessonDate"
              type="date"
              required
              value={lessonDate}
              onChange={(e) => setLessonDate(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200/90 bg-white/80 px-4 py-3"
            />
            {state.fieldErrors?.lessonDate ? (
              <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.lessonDate}</p>
            ) : null}
          </div>
          <div className="md:col-span-1">
            <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="teacherId">
              Konsultatsiya o‘qituvchisi <span className="text-red-500">*</span>
            </label>
            <select
              id="teacherId"
              name="teacherId"
              required
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200/90 bg-white/80 px-4 py-3"
            >
              <option value="">Tanlang</option>
              {activeTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  №{t.listNumber} — {t.fullName}
                </option>
              ))}
            </select>
            {state.fieldErrors?.teacherId ? (
              <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.teacherId}</p>
            ) : null}
          </div>
        </div>
      </section>

      {teacherId && lessonDate ? (
        <section className="space-y-4 rounded-2xl border border-teal-100 bg-teal-50/30 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-[var(--ink)]">3. O‘qituvchining bandligi (dars jadvali + konsultatsiyalar)</h2>
            {loadingSchedule ? (
              <span className="text-xs text-[var(--muted)]">Yuklanmoqda…</span>
            ) : null}
          </div>
          <p className="text-sm text-[var(--muted)]">
            Quyida tanlangan kunda o‘qituvchining barcha dars va konsultatsiya yozuvlari ko‘rinadi. Bo‘sh slotlardan birini tanlab
            konsultatsiya vaqtini belgilang.
          </p>

          {loadErr ? (
            <p className="text-sm text-red-700" role="alert">
              {loadErr}
            </p>
          ) : null}

          {!loadingSchedule && blocks.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Bu kunda hali band yozuvlar yo‘q — barcha soatli slotlar bo‘sh deb hisoblanadi.</p>
          ) : null}

          {blocks.length > 0 ? (
            <ul className="space-y-2 rounded-xl border border-white/80 bg-white/70 p-3 text-sm">
              {blocks.map((b, i) => (
                <li key={`${b.startMinutes}-${i}`} className="flex flex-wrap gap-2 border-b border-zinc-100 pb-2 last:border-0 last:pb-0">
                  <span className="font-medium text-[var(--ink)]">
                    {formatMinutesAsClock(b.startMinutes)}–{formatMinutesAsClock(b.endMinutes)}
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-semibold",
                      b.kind === "LESSON" ? "bg-amber-100 text-amber-950" : "bg-violet-100 text-violet-950",
                    )}
                  >
                    {b.kindLabel}
                  </span>
                  <span className="text-[var(--ink-soft)]">{b.studentName}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <div>
            <p className="mb-2 text-sm font-medium text-[var(--ink-soft)]">Bo‘sh vaqt — konsultatsiya sloti (50 daqiqa)</p>
            <input type="hidden" name="startMinutes" value={selectedStart ?? ""} />
            <div className="flex flex-wrap gap-2">
              {freeSlots.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedStart(m)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-medium transition",
                    selectedStart === m
                      ? "border-teal-500 bg-teal-600 text-white shadow-md"
                      : "border-zinc-200 bg-white text-[var(--ink)] hover:border-teal-300",
                  )}
                >
                  {formatSlotRangeLabel(m)}
                </button>
              ))}
            </div>
            {freeSlots.length === 0 && !loadingSchedule ? (
              <p className="mt-2 text-sm text-amber-800">Bu kunda bo‘sh slot qolmagan — boshqa sanani tanlang.</p>
            ) : null}
            {state.fieldErrors?.startMinutes ? (
              <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.startMinutes}</p>
            ) : null}
          </div>
        </section>
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-black">
          Avval o‘qituvchi va sanani tanlang — keyin bandliklar va bo‘sh vaqtlar chiqadi.
        </p>
      )}

      <section>
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="consultationAmountSom">
              Konsultatsiya summasi (so‘m) <span className="text-red-500">*</span>
            </label>
            <input
              id="consultationAmountSom"
              name="consultationAmountSom"
              type="number"
              min={1000}
              step={1000}
              required
              defaultValue={100000}
              onWheel={(e) => e.currentTarget.blur()}
              className="w-full rounded-2xl border border-zinc-200/90 bg-white/80 px-4 py-3"
              placeholder="100000"
            />
            {state.fieldErrors?.consultationAmountSom ? (
              <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.consultationAmountSom}</p>
            ) : null}
          </div>
        </div>

        <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="notes">
          Izoh (ixtiyoriy)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="w-full rounded-2xl border border-zinc-200/90 bg-white/80 px-4 py-3"
          placeholder="Masalan: birinchi qabul, yo‘naltirish…"
        />
      </section>

      <button
        type="submit"
        disabled={pending || !selectedStart}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        Konsultatsiyani saqlash
      </button>
      {!selectedStart && teacherId && lessonDate && !loadingSchedule ? (
        <p className="text-xs text-[var(--muted)]">Davom etish uchun yuqoridagi bo‘sh slotlardan birini tanlang.</p>
      ) : null}
    </form>
  );
}
