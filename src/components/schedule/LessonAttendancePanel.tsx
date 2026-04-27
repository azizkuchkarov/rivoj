"use client";

import { useActionState, useEffect, useState } from "react";

import { Loader2, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { markLessonAttendance, type LessonAttendanceActionState } from "@/app/schedule/lesson-attendance-actions";
import type { LessonWithRelations } from "@/components/schedule/schedule-types";
import { LessonAttendance, LessonGuardianFee } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";
import { formatLessonDateHeadingUzUtc } from "@/lib/schedule-date-format";

function attendanceLabel(lesson: LessonWithRelations): string {
  if (lesson.attendance === LessonAttendance.UNMARKED) return "Belgilanmagan";
  if (lesson.attendance === LessonAttendance.ABSENT) return "Kelmadi";
  if (lesson.attendance === LessonAttendance.PRESENT) {
    if (lesson.guardianFee === LessonGuardianFee.NA) return "Keldi · abonentlik";
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

  const isUnmarked = lesson.attendance === LessonAttendance.UNMARKED;
  const isAbsentLocked = lesson.attendance === LessonAttendance.ABSENT;
  const isPresentPaidLocked =
    lesson.attendance === LessonAttendance.PRESENT && lesson.guardianFee === LessonGuardianFee.PAID;
  const isPresentUnpaidUpgrade =
    lesson.attendance === LessonAttendance.PRESENT && lesson.guardianFee === LessonGuardianFee.UNPAID;

  const fullyLocked = isAbsentLocked || isPresentPaidLocked;
  const isSubscriptionLesson =
    lesson.consumedSubscriptionPaymentId != null ||
    lesson.notes?.toLowerCase().includes("abonentlik") ||
    lesson.notes?.toLowerCase().includes("abonent") ||
    lesson.notes?.toLowerCase().includes("paket");

  const [attendance, setAttendance] = useState<LessonAttendance>(
    isUnmarked ? LessonAttendance.PRESENT : lesson.attendance,
  );
  const [fee, setFee] = useState<LessonGuardianFee>(
    isSubscriptionLesson || lesson.guardianFee === LessonGuardianFee.NA ? LessonGuardianFee.NA : lesson.guardianFee,
  );

  useEffect(() => {
    if (state?.success) {
      onClose();
      if (state.rescheduleUrl) {
        router.push(state.rescheduleUrl);
      } else {
        router.refresh();
      }
    }
  }, [state?.success, state?.rescheduleUrl, onClose, router]);

  const showFee = attendance === LessonAttendance.PRESENT && !isSubscriptionLesson;
  const dateLabel = formatLessonDateHeadingUzUtc(lesson.lessonDate);

  if (fullyLocked) {
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
          <p className="mt-1 text-sm text-black">
            {dateLabel} · {lesson.teacher.listNumber ? `№${lesson.teacher.listNumber} ` : null}
            {lesson.teacher.fullName} · {lesson.student.fullName}
          </p>
          <p className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-[var(--ink)]">
            Joriy holat: <strong>{attendanceLabel(lesson)}</strong>
          </p>
          <p className="mt-2 text-xs text-black">
            Belgilanganidan keyin «keldi / kelmadi» va to‘lovni qayta o‘zgartirib bo‘lmaydi.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-zinc-200 px-6 py-2.5 text-sm font-medium text-[var(--ink-soft)] hover:bg-zinc-50"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <p className="mt-1 text-sm text-black">
          {dateLabel} · {lesson.teacher.listNumber ? `№${lesson.teacher.listNumber} ` : null}
          {lesson.teacher.fullName} · {lesson.student.fullName}
        </p>

        <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50/50 px-3 py-2 text-xs text-teal-950">
          <strong>Qoidalar:</strong> abonentlikda admin faqat «keldi / kelmadi» belgilaydi (har dars uchun alohida
          to‘lov kiritilmaydi). Bir martalikda esa «to‘lov qildi / qilmadi» holati saqlanadi va qarz yuritiladi.
          «Kelmadi» bo‘lsa, keyin boshqa kunga qayta belgilash mumkin.
        </div>
        {isSubscriptionLesson ? (
          <p className="mt-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-950">
            Bu dars abonentlik oqimida. Shu sababli pastda «To‘lov qildi / qilmadi» tanlovi ko‘rsatilmaydi.
          </p>
        ) : null}

        {state?.error ? (
          <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {state.error}
          </div>
        ) : null}

        <form action={formAction} className="mt-6 space-y-5">
          <input type="hidden" name="lessonId" value={lesson.id} />

          {isPresentUnpaidUpgrade ? (
            <>
              <input type="hidden" name="attendance" value={LessonAttendance.PRESENT} />
              <input type="hidden" name="guardianFee" value={LessonGuardianFee.PAID} />
              <p className="rounded-2xl border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
                Hozir: <strong>{attendanceLabel(lesson)}</strong>. Faqat to‘lov kelgach «to‘lov qildi» deb
                belgilashingiz mumkin.
              </p>
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-950">
                Pastdagi tugma qarzni yopib, to‘lovni «qildi» holatiga o‘tkazadi (boshqa o‘zgartirish yo‘q).
              </p>
            </>
          ) : (
            <>
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
            </>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-[1.03] disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {isPresentUnpaidUpgrade ? "To‘lov qildi deb saqlash" : "Saqlash"}
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

      </div>
    </div>
  );
}

export function LessonAttendanceTrigger({
  lesson,
  compact,
  label,
}: {
  lesson: LessonWithRelations;
  compact?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const isLabelMode = Boolean(label);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center justify-center gap-1 rounded font-semibold text-teal-800 ring-1 ring-teal-200/90 hover:bg-teal-50",
          isLabelMode
            ? "w-full px-2 py-1.5 text-[11px]"
            : compact
              ? "w-auto px-2 py-1 text-[10px]"
              : "mt-1 w-full bg-white px-1 py-0.5 text-[9px]",
        )}
      >
        {!isLabelMode ? <UserCheck className={cn("shrink-0", compact ? "h-3 w-3" : "h-2.5 w-2.5")} aria-hidden /> : null}
        {label ?? "Keldi / kelmadi"}
      </button>
      {!compact && !isLabelMode ? (
        <p className="mt-0.5 text-center text-[8px] leading-tight text-zinc-500">{attendanceLabel(lesson)}</p>
      ) : null}
      {open ? <LessonAttendanceDialog lesson={lesson} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
