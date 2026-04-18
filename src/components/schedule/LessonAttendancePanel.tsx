"use client";

import { useActionState, useEffect, useState } from "react";

import { Loader2, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { markLessonAttendance, type LessonAttendanceActionState } from "@/app/schedule/lesson-attendance-actions";
import type { LessonWithRelations } from "@/components/schedule/schedule-types";
import { LessonAttendance, LessonGuardianFee } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";
import { formatSomUZS } from "@/lib/format-currency";
import { formatLessonDateHeadingUzUtc } from "@/lib/schedule-date-format";

function attendanceLabel(lesson: LessonWithRelations): string {
  if (lesson.attendance === LessonAttendance.UNMARKED) return "Belgilanmagan";
  if (lesson.attendance === LessonAttendance.ABSENT) return "Kelmadi";
  if (lesson.attendance === LessonAttendance.PRESENT) {
    if (lesson.guardianFee === LessonGuardianFee.PAID) return "Keldi · to‘lov qildi";
    if (lesson.guardianFee === LessonGuardianFee.UNPAID) return "Keldi · to‘lov yo‘q (qarz)";
  }
  return "—";
}

type LessonAttendanceDialogProps = {
  lesson: LessonWithRelations;
  onClose: () => void;
};

export function LessonAttendanceDialog({ lesson, onClose }: LessonAttendanceDialogProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(markLessonAttendance, {} as LessonAttendanceActionState);

  const [attendance, setAttendance] = useState<LessonAttendance>(
    lesson.attendance === LessonAttendance.UNMARKED ? LessonAttendance.PRESENT : lesson.attendance,
  );
  const [fee, setFee] = useState<LessonGuardianFee>(
    lesson.guardianFee === LessonGuardianFee.NA ? LessonGuardianFee.PAID : lesson.guardianFee,
  );

  useEffect(() => {
    if (state?.success) {
      onClose();
      router.refresh();
    }
  }, [state?.success, onClose, router]);

  const showFee = attendance === LessonAttendance.PRESENT;
  const dateLabel = formatLessonDateHeadingUzUtc(lesson.lessonDate);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendance-dialog-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/80 bg-[color:var(--surface)] p-6 shadow-2xl">
        <h2 id="attendance-dialog-title" className="font-display text-lg font-semibold text-[var(--ink)]">
          Dars holati
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {dateLabel} · {lesson.teacher.listNumber ? `№${lesson.teacher.listNumber} ` : null}
          {lesson.teacher.fullName} · {lesson.student.fullName}
        </p>

        <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50/50 px-3 py-2 text-xs text-teal-950">
          <strong>Qoidalar:</strong> kelmagan — hisob yo‘q. Kelgan dars uchun summa «Yangi dars» / to‘lovlardan
          avtomatik olinadi (abonentlik yoki rejadagi kunlik ulush). Keldi va to‘lov qildi / to‘lamagan — tushum va
          qarz shu bo‘yicha yuritiladi.
        </div>

        {state?.error ? (
          <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {state.error}
          </div>
        ) : null}

        <form action={formAction} className="mt-6 space-y-5">
          <input type="hidden" name="lessonId" value={lesson.id} />

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-[var(--ink-soft)]">Bola darsga</legend>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label
                className={cn(
                  "flex flex-1 cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 text-sm",
                  attendance === LessonAttendance.PRESENT
                    ? "border-teal-500 bg-teal-50 ring-2 ring-teal-200"
                    : "border-zinc-200 bg-white/80",
                )}
              >
                <input
                  type="radio"
                  name="attendance"
                  value={LessonAttendance.PRESENT}
                  checked={attendance === LessonAttendance.PRESENT}
                  onChange={() => setAttendance(LessonAttendance.PRESENT)}
                  className="sr-only"
                />
                Darsga keldi
              </label>
              <label
                className={cn(
                  "flex flex-1 cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 text-sm",
                  attendance === LessonAttendance.ABSENT
                    ? "border-zinc-500 bg-zinc-100 ring-2 ring-zinc-200"
                    : "border-zinc-200 bg-white/80",
                )}
              >
                <input
                  type="radio"
                  name="attendance"
                  value={LessonAttendance.ABSENT}
                  checked={attendance === LessonAttendance.ABSENT}
                  onChange={() => setAttendance(LessonAttendance.ABSENT)}
                  className="sr-only"
                />
                Darsga kelmadi
              </label>
            </div>
          </fieldset>

          {showFee ? (
            <>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-[var(--ink-soft)]">To‘lov</legend>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label
                    className={cn(
                      "flex flex-1 cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 text-sm",
                      fee === LessonGuardianFee.PAID
                        ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
                        : "border-zinc-200 bg-white/80",
                    )}
                  >
                    <input
                      type="radio"
                      name="guardianFee"
                      value={LessonGuardianFee.PAID}
                      checked={fee === LessonGuardianFee.PAID}
                      onChange={() => setFee(LessonGuardianFee.PAID)}
                      className="sr-only"
                    />
                    To‘lov qildi
                  </label>
                  <label
                    className={cn(
                      "flex flex-1 cursor-pointer items-center gap-2 rounded-2xl border px-4 py-3 text-sm",
                      fee === LessonGuardianFee.UNPAID
                        ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200"
                        : "border-zinc-200 bg-white/80",
                    )}
                  >
                    <input
                      type="radio"
                      name="guardianFee"
                      value={LessonGuardianFee.UNPAID}
                      checked={fee === LessonGuardianFee.UNPAID}
                      onChange={() => setFee(LessonGuardianFee.UNPAID)}
                      className="sr-only"
                    />
                    To‘lov qilmadi
                  </label>
                </div>
              </fieldset>
            </>
          ) : (
            <input type="hidden" name="guardianFee" value={LessonGuardianFee.NA} />
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-[1.03] disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Saqlash
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-zinc-200 px-6 py-2.5 text-sm font-medium text-[var(--ink-soft)] hover:bg-zinc-50"
            >
              Bekor qilish
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs text-[var(--muted)]">
          Hozirgi holat: <span className="font-medium text-[var(--ink)]">{attendanceLabel(lesson)}</span>
          {lesson.settlementSom != null ? (
            <span className="ml-2 tabular-nums">({formatSomUZS(lesson.settlementSom)} so‘m)</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

export function LessonAttendanceTrigger({
  lesson,
  compact,
}: {
  lesson: LessonWithRelations;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center justify-center gap-1 rounded font-semibold text-teal-800 ring-1 ring-teal-200/90 hover:bg-teal-50",
          compact
            ? "w-auto px-2 py-1 text-[10px]"
            : "mt-1 w-full bg-white/90 px-1 py-0.5 text-[9px]",
        )}
      >
        <UserCheck className={cn("shrink-0", compact ? "h-3 w-3" : "h-2.5 w-2.5")} aria-hidden />
        Keldi / to‘lov
      </button>
      {!compact ? (
        <p className="mt-0.5 text-center text-[8px] leading-tight text-zinc-500">{attendanceLabel(lesson)}</p>
      ) : null}
      {open ? <LessonAttendanceDialog lesson={lesson} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
