"use client";

import { useActionState, useMemo } from "react";

import { Loader2 } from "lucide-react";

import type { LessonActionState } from "@/app/schedule/actions";
import type { Student, Teacher } from "@/generated/prisma/client";
import { LessonKind } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";
import { formatSlotRangeLabel, getSlotStartMinutesList } from "@/lib/time-minutes";

type LessonFormProps = {
  action: (state: LessonActionState, formData: FormData) => Promise<LessonActionState>;
  /** Dars jadvali yoki konsultatsiya jadvali yozuvi */
  lessonKind?: (typeof LessonKind)[keyof typeof LessonKind];
  teachers: Pick<Teacher, "id" | "fullName" | "isActive" | "listNumber">[];
  students: Pick<Student, "id" | "fullName" | "isActive">[];
  defaultLessonDate: string;
  /** Jadvaldan kelganda (URL) */
  defaultTeacherId?: string;
  defaultStartMinutes?: number;
  submitLabel: string;
};

function fieldClass(err?: string) {
  return cn(
    "w-full rounded-2xl border bg-white/80 px-4 py-3 text-[var(--ink)] shadow-inner shadow-black/5 outline-none transition focus:border-teal-300 focus:ring-4 focus:ring-teal-500/15",
    err ? "border-red-300 focus:border-red-400 focus:ring-red-200/40" : "border-zinc-200/90",
  );
}

export function LessonForm({
  action,
  lessonKind = LessonKind.LESSON,
  teachers,
  students,
  defaultLessonDate,
  defaultTeacherId = "",
  defaultStartMinutes,
  submitLabel,
}: LessonFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const slots = useMemo(() => getSlotStartMinutesList(), []);

  const activeTeachers = teachers.filter((t) => t.isActive);
  const activeStudents = students.filter((s) => s.isActive);
  const isConsultation = lessonKind === LessonKind.CONSULTATION;

  const teacherDefault =
    defaultTeacherId && activeTeachers.some((t) => t.id === defaultTeacherId) ? defaultTeacherId : "";
  const startDefault =
    defaultStartMinutes != null && slots.includes(defaultStartMinutes) ? defaultStartMinutes : slots[0];

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="kind" value={lessonKind} />
      {state.error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900"
        >
          {state.error}
        </div>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="lessonDate">
            Sana <span className="text-red-500">*</span>
          </label>
          <input
            id="lessonDate"
            name="lessonDate"
            type="date"
            required
            defaultValue={defaultLessonDate}
            className={fieldClass(state.fieldErrors?.lessonDate)}
          />
          {state.fieldErrors?.lessonDate ? (
            <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.lessonDate}</p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="startMinutes">
            {isConsultation ? "Vaqt sloti (50 daqiqa)" : "Dars sloti (50 daqiqa)"}
          </label>
          <select
            id="startMinutes"
            name="startMinutes"
            required
            defaultValue={startDefault}
            className={fieldClass(state.fieldErrors?.startMinutes)}
          >
            {slots.map((m) => (
              <option key={m} value={m}>
                {formatSlotRangeLabel(m)}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            Har bir {isConsultation ? "konsultatsiya" : "dars"} 50 daqiqa (masalan 8:00–8:50). Keyingi slot yangi soat
            boshida — o‘qituvchi 9:00 da yangi bandlikni boshlashi mumkin.
          </p>
          {state.fieldErrors?.startMinutes ? (
            <p className="mt-1.5 text-xs text-red-600">{state.fieldErrors.startMinutes}</p>
          ) : null}
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="teacherId">
            O‘qituvchi
          </label>
          <select
            id="teacherId"
            name="teacherId"
            required
            className={fieldClass(state.fieldErrors?.teacherId)}
            defaultValue={teacherDefault}
          >
            <option value="" disabled>
              Tanlang
            </option>
            {activeTeachers.map((t) => (
              <option key={t.id} value={t.id}>
                №{t.listNumber} — {t.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="studentId">
            O‘quvchi
          </label>
          <select
            id="studentId"
            name="studentId"
            required
            className={fieldClass(state.fieldErrors?.studentId)}
            defaultValue=""
          >
            <option value="" disabled>
              Tanlang
            </option>
            {activeStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="notes">
            Izoh
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className={fieldClass(state.fieldErrors?.notes)}
            placeholder="Ixtiyoriy"
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
        {submitLabel}
      </button>
    </form>
  );
}
