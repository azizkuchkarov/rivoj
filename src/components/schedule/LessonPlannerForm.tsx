"use client";

import { useActionState, useCallback, useEffect, useMemo, useState } from "react";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import {
  createLessonBatch,
  getLessonPlannerData,
  type LessonBatchActionState,
  type PlannerLessonCell,
} from "@/app/schedule/actions";
import type { Student, Teacher } from "@/generated/prisma/client";
import { LessonKind, PaymentKind, PaymentMethod } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";
import { formatSlotRangeLabel, getSlotStartMinutesList } from "@/lib/time-minutes";
import {
  formatPlannerGridDayMonthUtc,
  formatPlannerGridWeekdayUtc,
  formatPlannerWeekBandUtc,
} from "@/lib/schedule-date-format";
import { addDaysUTC, parseWeekMondayParam, startOfWeekMondayUTC, toISODateStringUTC } from "@/lib/week-utils";

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: PaymentMethod.CASH, label: "Naqd pul" },
  { value: PaymentMethod.CARD, label: "Karta" },
  { value: PaymentMethod.TRANSFER, label: "Bank o‘tkazmasi" },
  { value: PaymentMethod.OTHER, label: "Boshqa" },
];

function plannerFieldClass() {
  return "w-full rounded-2xl border border-zinc-200/90 bg-white/80 px-4 py-3 text-[var(--ink)] shadow-inner shadow-black/5 outline-none transition focus:border-teal-300 focus:ring-4 focus:ring-teal-500/15";
}

type LessonPlannerFormProps = {
  teachers: Pick<Teacher, "id" | "fullName" | "isActive" | "listNumber">[];
  students: Pick<Student, "id" | "fullName" | "isActive">[];
  initialTeacherId?: string;
  initialStudentId?: string;
  /** URL dan kelganda hafta */
  initialWeekMondayIso?: string;
  /** Oldindan belgilangan slot(lar) */
  initialSlots?: { lessonDate: string; startMinutes: number }[];
};

function slotKey(dayIso: string, startM: number) {
  return `${dayIso}|${startM}`;
}

function parseSlotKey(key: string): { lessonDate: string; startMinutes: number } {
  const [lessonDate, sm] = key.split("|");
  return { lessonDate, startMinutes: Number(sm) };
}

export function LessonPlannerForm({
  teachers,
  students,
  initialTeacherId = "",
  initialStudentId = "",
  initialWeekMondayIso,
  initialSlots = [],
}: LessonPlannerFormProps) {
  const activeTeachers = teachers.filter((t) => t.isActive);
  const activeStudents = students.filter((s) => s.isActive);

  const defaultMonday =
    initialWeekMondayIso && /^\d{4}-\d{2}-\d{2}$/.test(initialWeekMondayIso)
      ? initialWeekMondayIso
      : toISODateStringUTC(startOfWeekMondayUTC(new Date()));

  const [teacherId, setTeacherId] = useState(() =>
    initialTeacherId && activeTeachers.some((t) => t.id === initialTeacherId) ? initialTeacherId : "",
  );
  const [studentId, setStudentId] = useState(() =>
    initialStudentId && activeStudents.some((s) => s.id === initialStudentId) ? initialStudentId : "",
  );
  const [weekMondayIso, setWeekMondayIso] = useState(defaultMonday);

  const defaultPaidAt = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [scheduleUnlocked, setScheduleUnlocked] = useState(false);
  const [paymentGateError, setPaymentGateError] = useState<string | null>(null);

  const [payKind, setPayKind] = useState<PaymentKind>(PaymentKind.DAILY);
  const [payAmountSom, setPayAmountSom] = useState("");
  const [payPaidAt, setPayPaidAt] = useState(defaultPaidAt);
  const [payMethod, setPayMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [payDescription, setPayDescription] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [payTeacherShareSom, setPayTeacherShareSom] = useState("");
  const [paySubLessons, setPaySubLessons] = useState("");
  const [paySubPerLesson, setPaySubPerLesson] = useState("");

  const subscriptionTeacherTotal = useMemo(() => {
    const n = Number.parseInt(paySubLessons, 10);
    const p = Number.parseInt(paySubPerLesson, 10);
    if (!Number.isFinite(n) || !Number.isFinite(p) || n < 1 || p < 0) return null;
    return n * p;
  }, [paySubLessons, paySubPerLesson]);

  const subscriptionPackSize = useMemo(() => {
    const n = Number.parseInt(paySubLessons, 10);
    return Number.isFinite(n) && n >= 1 ? n : null;
  }, [paySubLessons]);

  const [lessons, setLessons] = useState<PlannerLessonCell[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const sl of initialSlots) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(sl.lessonDate) && Number.isFinite(sl.startMinutes)) {
        s.add(slotKey(sl.lessonDate, sl.startMinutes));
      }
    }
    return s;
  });

  const slotStarts = useMemo(() => getSlotStartMinutesList(), []);
  const dayIsos = useMemo(() => {
    const mon = parseWeekMondayParam(weekMondayIso);
    return Array.from({ length: 7 }, (_, i) => toISODateStringUTC(addDaysUTC(mon, i)));
  }, [weekMondayIso]);

  const shiftWeek = (delta: number) => {
    const m = parseWeekMondayParam(weekMondayIso);
    setWeekMondayIso(toISODateStringUTC(addDaysUTC(m, delta * 7)));
  };

  useEffect(() => {
    setScheduleUnlocked(false);
    setPaymentGateError(null);
  }, [teacherId, studentId]);

  useEffect(() => {
    if (!teacherId || !studentId) {
      setLessons([]);
      setLoadError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getLessonPlannerData(teacherId, studentId, weekMondayIso)
      .then((d) => {
        if (!cancelled) {
          setLessons(d.lessons);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("Jadvalni yuklashda xatolik.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teacherId, studentId, weekMondayIso]);

  const cellState = useCallback(
    (dayIso: string, startM: number) => {
      const tLesson = lessons.find(
        (L) => L.lessonDateIso === dayIso && L.startMinutes === startM && L.teacherId === teacherId,
      );
      const sLesson = lessons.find(
        (L) => L.lessonDateIso === dayIso && L.startMinutes === startM && L.studentId === studentId,
      );

      if (tLesson) {
        if (tLesson.studentId === studentId) {
          return { kind: "ours" as const, label: tLesson.studentName, lesson: tLesson };
        }
        return { kind: "teacher_busy" as const, label: tLesson.studentName, lesson: tLesson };
      }
      if (sLesson) {
        return { kind: "student_busy" as const, label: sLesson.teacherShort, lesson: sLesson };
      }
      return { kind: "free" as const };
    },
    [lessons, teacherId, studentId],
  );

  const toggle = (dayIso: string, startM: number) => {
    const st = cellState(dayIso, startM);
    if (st.kind !== "free") return;
    const k = slotKey(dayIso, startM);
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  };

  const slotsPayload = useMemo(() => {
    return [...selected]
      .map(parseSlotKey)
      .sort((a, b) => a.lessonDate.localeCompare(b.lessonDate) || a.startMinutes - b.startMinutes);
  }, [selected]);

  const [state, formAction, pending] = useActionState(createLessonBatch, {} as LessonBatchActionState);

  const weekLabel = useMemo(() => formatPlannerWeekBandUtc(parseWeekMondayParam(weekMondayIso)), [weekMondayIso]);

  const showPaymentBlock = Boolean(teacherId && studentId);
  const showGrid = Boolean(teacherId && studentId && scheduleUnlocked);

  const tryContinueToSchedule = () => {
    setPaymentGateError(null);
    const amount = Number.parseInt(payAmountSom, 10);
    if (!Number.isFinite(amount) || amount < 1000) {
      setPaymentGateError("O‘quvchi to‘lovi kamida 1000 so‘m bo‘lsin.");
      return;
    }
    if (payKind === PaymentKind.DAILY) {
      const share = Number.parseInt(payTeacherShareSom, 10);
      if (!Number.isFinite(share) || share < 0) {
        setPaymentGateError("O‘qituvchi ulushini kiriting.");
        return;
      }
      if (share > amount) {
        setPaymentGateError("O‘qituvchi ulushi jami to‘lovdan oshmasin.");
        return;
      }
    } else {
      const n = Number.parseInt(paySubLessons, 10);
      const pl = Number.parseInt(paySubPerLesson, 10);
      if (!Number.isFinite(n) || n < 1) {
        setPaymentGateError("Abonentlik: darslar sonini kiriting.");
        return;
      }
      if (!Number.isFinite(pl) || pl < 0) {
        setPaymentGateError("Har bir dars uchun o‘qituvchi ulushini kiriting.");
        return;
      }
    }
    setScheduleUnlocked(true);
  };

  return (
    <div className="space-y-8">
      {state?.error ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900">
          {state.error}
        </div>
      ) : null}
      {loadError ? (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
          {loadError}
        </div>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="planner-teacher">
            O‘qituvchi <span className="text-red-500">*</span>
          </label>
          <select
            id="planner-teacher"
            value={teacherId}
            onChange={(e) => {
              setTeacherId(e.target.value);
              setSelected(new Set());
            }}
            className="w-full rounded-2xl border border-zinc-200/90 bg-white/80 px-4 py-3 text-[var(--ink)] shadow-inner shadow-black/5 outline-none focus:border-teal-300 focus:ring-4 focus:ring-teal-500/15"
          >
            <option value="">Tanlang</option>
            {activeTeachers.map((t) => (
              <option key={t.id} value={t.id}>
                №{t.listNumber} — {t.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="planner-student">
            O‘quvchi <span className="text-red-500">*</span>
          </label>
          <select
            id="planner-student"
            value={studentId}
            onChange={(e) => {
              setStudentId(e.target.value);
              setSelected(new Set());
            }}
            className="w-full rounded-2xl border border-zinc-200/90 bg-white/80 px-4 py-3 text-[var(--ink)] shadow-inner shadow-black/5 outline-none focus:border-teal-300 focus:ring-4 focus:ring-teal-500/15"
          >
            <option value="">Tanlang</option>
            {activeStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName}
              </option>
            ))}
          </select>
        </div>
      </section>

      {showPaymentBlock && !scheduleUnlocked ? (
        <section className="rounded-2xl border border-violet-100 bg-violet-50/40 p-6 shadow-inner shadow-violet-900/5">
          <h2 className="text-base font-semibold text-[var(--ink)]">To‘lov</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Bir martalik yoki abonentlik. Keyin haftalik jadvalda bo‘sh vaqtlarni tanlaysiz.
          </p>
          {paymentGateError ? (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
              {paymentGateError}
            </p>
          ) : null}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="planner-pay-kind">
                To‘lov turi <span className="text-red-500">*</span>
              </label>
              <select
                id="planner-pay-kind"
                value={payKind}
                onChange={(e) => setPayKind(e.target.value as PaymentKind)}
                className={plannerFieldClass()}
              >
                <option value={PaymentKind.DAILY}>Bir martalik (o‘quvchi + o‘qituvchi ulushi)</option>
                <option value={PaymentKind.SUBSCRIPTION}>
                  Abonentlik (jami summa, darslar soni, har bir dars uchun o‘qituvchi ulushi)
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="planner-pay-amount">
                {payKind === PaymentKind.DAILY ? (
                  <>O‘quvchi to‘lovi (so‘m) <span className="text-red-500">*</span></>
                ) : (
                  <>Abonentlik jami (so‘m) <span className="text-red-500">*</span></>
                )}
              </label>
              <input
                id="planner-pay-amount"
                type="number"
                min={1000}
                step={1000}
                value={payAmountSom}
                onChange={(e) => setPayAmountSom(e.target.value)}
                className={plannerFieldClass()}
                placeholder="100000"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="planner-pay-date">
                To‘lov sanasi <span className="text-red-500">*</span>
              </label>
              <input
                id="planner-pay-date"
                type="date"
                value={payPaidAt}
                onChange={(e) => setPayPaidAt(e.target.value)}
                className={plannerFieldClass()}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="planner-pay-method">
                To‘lov usuli
              </label>
              <select
                id="planner-pay-method"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                className={plannerFieldClass()}
              >
                {PAYMENT_METHOD_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {payKind === PaymentKind.DAILY ? (
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="planner-pay-share">
                  Shu to‘lovdan o‘qituvchiga (so‘m) <span className="text-red-500">*</span>
                </label>
                <input
                  id="planner-pay-share"
                  type="number"
                  min={0}
                  step={1000}
                  value={payTeacherShareSom}
                  onChange={(e) => setPayTeacherShareSom(e.target.value)}
                  className={plannerFieldClass()}
                  placeholder="50000"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="planner-pay-sub-n">
                    Nechta dars uchun <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="planner-pay-sub-n"
                    type="number"
                    min={1}
                    max={2000}
                    step={1}
                    value={paySubLessons}
                    onChange={(e) => setPaySubLessons(e.target.value)}
                    className={plannerFieldClass()}
                    placeholder="12"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="planner-pay-sub-pl">
                    Har bir dars uchun o‘qituvchiga (so‘m) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="planner-pay-sub-pl"
                    type="number"
                    min={0}
                    step={1000}
                    value={paySubPerLesson}
                    onChange={(e) => setPaySubPerLesson(e.target.value)}
                    className={plannerFieldClass()}
                    placeholder="50000"
                  />
                </div>
                <div className="md:col-span-2 rounded-xl border border-violet-100 bg-white/60 px-4 py-3 text-sm text-violet-950">
                  {subscriptionTeacherTotal != null ? (
                    <p>
                      <span className="font-medium">Hisoblangan jami o‘qituvchi ulushi:</span>{" "}
                      <span className="tabular-nums font-semibold">
                        {subscriptionTeacherTotal.toLocaleString("uz-UZ")} so‘m
                      </span>
                    </p>
                  ) : (
                    <p className="text-[var(--muted)]">Darslar soni va dars narxini kiriting.</p>
                  )}
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="planner-pay-desc">
                Maqsad / izoh (qisqa, ixtiyoriy)
              </label>
              <input
                id="planner-pay-desc"
                value={payDescription}
                onChange={(e) => setPayDescription(e.target.value)}
                className={plannerFieldClass()}
                placeholder="Masalan: mart paketi"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="planner-pay-notes">
                To‘lov bo‘yicha qayd (ixtiyoriy)
              </label>
              <textarea
                id="planner-pay-notes"
                rows={2}
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className={plannerFieldClass()}
                placeholder="Ichki eslatma"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={tryContinueToSchedule}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-[1.03]"
            >
              Jadvalga o‘tish — slotlarni tanlash
            </button>
            <span className="text-sm text-[var(--muted)]">To‘lov ma’lumotlari keyin tasdiqlashda saqlanadi.</span>
          </div>
        </section>
      ) : null}

      {showGrid ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">O‘qituvchining haftalik bandligi</p>
              <p className="text-xs text-[var(--muted)]">
                Kunlar ustunda, soatlar chapda. Bo‘sh kataklarni bosing — bir nechta haftada tanlash mumkin (hafta
                o‘zgarganda tanlovlar saqlanadi).
              </p>
              <button
                type="button"
                onClick={() => {
                  setScheduleUnlocked(false);
                  setSelected(new Set());
                }}
                className="mt-2 text-xs font-medium text-violet-800 underline-offset-4 hover:underline"
              >
                To‘lovni o‘zgartish
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => shiftWeek(-1)}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white/90 px-3 py-2 text-sm font-medium text-[var(--ink-soft)] shadow-sm hover:bg-zinc-50"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Oldingi hafta
              </button>
              <span className="text-sm font-medium text-teal-900">{weekLabel}</span>
              <button
                type="button"
                onClick={() => shiftWeek(1)}
                className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white/90 px-3 py-2 text-sm font-medium text-[var(--ink-soft)] shadow-sm hover:bg-zinc-50"
              >
                Keyingi hafta
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="relative overflow-x-auto rounded-2xl border border-white/70 bg-[color:var(--surface)] shadow-lg shadow-black/5">
            {loading ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[1px]">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" aria-hidden />
              </div>
            ) : null}
            <table className="w-full min-w-[900px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-teal-50/80">
                  <th className="sticky left-0 z-10 min-w-[88px] border-r border-zinc-200 bg-teal-50/98 px-2 py-2 font-semibold text-teal-900">
                    Vaqt
                  </th>
                  {dayIsos.map((d) => (
                    <th key={d} className="min-w-[100px] px-1 py-2 text-center font-semibold text-[var(--ink)]">
                      <div>{formatPlannerGridWeekdayUtc(d)}</div>
                      <div className="text-[10px] font-normal text-[var(--muted)]">
                        {formatPlannerGridDayMonthUtc(d)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slotStarts.map((startM) => (
                  <tr key={startM} className="border-b border-zinc-100/90 odd:bg-white/40">
                    <td className="sticky left-0 z-[1] border-r border-zinc-200 bg-white/95 px-2 py-1.5 align-middle text-[10px] font-medium text-zinc-600">
                      {formatSlotRangeLabel(startM)}
                    </td>
                    {dayIsos.map((dayIso) => {
                      const st = cellState(dayIso, startM);
                      const k = slotKey(dayIso, startM);
                      const isSel = selected.has(k);

                      if (st.kind === "ours") {
                        return (
                          <td key={dayIso} className="px-1 py-1 align-top">
                            <div
                              className="min-h-[44px] rounded-lg border border-emerald-300 bg-emerald-50/95 px-1 py-1 text-[10px] leading-tight text-emerald-950"
                              title="Bu juftlikda allaqachon dars bor"
                            >
                              <span className="font-semibold">Mavjud</span>
                              <div className="truncate">{st.lesson.kind === LessonKind.CONSULTATION ? "Kons." : "Dars"}</div>
                            </div>
                          </td>
                        );
                      }

                      if (st.kind === "teacher_busy") {
                        return (
                          <td key={dayIso} className="px-1 py-1 align-top">
                            <div
                              className="min-h-[44px] rounded-lg border border-amber-200 bg-amber-50/90 px-1 py-1 text-[10px] leading-tight text-amber-950"
                              title={`O‘qituvchi band: ${st.label}`}
                            >
                              <span className="font-medium">Boshqa o‘quvchi</span>
                              <div className="truncate">{st.label}</div>
                            </div>
                          </td>
                        );
                      }

                      if (st.kind === "student_busy") {
                        return (
                          <td key={dayIso} className="px-1 py-1 align-top">
                            <div
                              className="min-h-[44px] rounded-lg border border-violet-200 bg-violet-50/90 px-1 py-1 text-[10px] leading-tight text-violet-950"
                              title={`O‘quvchi band: ${st.label}`}
                            >
                              <span className="font-medium">Bola band</span>
                              <div className="truncate">{st.label}</div>
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td key={dayIso} className="px-1 py-1 align-top">
                          <button
                            type="button"
                            onClick={() => toggle(dayIso, startM)}
                            className={cn(
                              "flex min-h-[44px] w-full flex-col items-center justify-center rounded-lg border border-dashed px-1 py-1 text-[10px] transition",
                              isSel
                                ? "border-teal-500 bg-teal-100/90 font-semibold text-teal-950 shadow-inner"
                                : "border-zinc-200/90 bg-white/50 text-zinc-400 hover:border-teal-300 hover:bg-teal-50/60 hover:text-teal-900",
                            )}
                          >
                            {isSel ? "✓ Tanlangan" : "Tanlash"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {payKind === PaymentKind.SUBSCRIPTION && subscriptionPackSize != null ? (
            <div
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm",
                slotsPayload.length === subscriptionPackSize
                  ? "border-emerald-200 bg-emerald-50/80 text-emerald-950"
                  : "border-violet-200 bg-violet-50/70 text-violet-950",
              )}
            >
              <p className="font-semibold">Abonentlik: {subscriptionPackSize} ta dars</p>
              <p className="mt-1 text-[13px] leading-snug">
                Jadvalda aynan <strong>{subscriptionPackSize}</strong> ta bo‘sh slot tanlashingiz kerak (hozir:{" "}
                <strong className="tabular-nums">{slotsPayload.length}</strong>
                {slotsPayload.length === subscriptionPackSize ? " — tayyor" : ""}).
                {slotsPayload.length !== subscriptionPackSize ? (
                  <>
                    {" "}
                    Boshqa haftaga o‘tib qo‘shimcha slot belgilashingiz mumkin — oldingi haftadagi tanlovlar
                    o‘chmaydi.
                  </>
                ) : null}
              </p>
            </div>
          ) : null}

          <ul className="flex flex-wrap gap-3 text-[11px] text-[var(--muted)]">
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-dashed border-zinc-300 bg-white/50" /> Bo‘sh
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-teal-500 bg-teal-100" /> Tanlangan
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-emerald-300 bg-emerald-50" /> Allaqachon shu juftlik
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-amber-200 bg-amber-50" /> O‘qituvchi band
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-violet-200 bg-violet-50" /> O‘quvchi boshqa darsda
            </li>
          </ul>

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="teacherId" value={teacherId} />
            <input type="hidden" name="studentId" value={studentId} />
            <input type="hidden" name="slotsJson" value={JSON.stringify(slotsPayload)} />
            <input type="hidden" name="paymentKind" value={payKind} />
            <input type="hidden" name="paymentAmountSom" value={payAmountSom} />
            <input type="hidden" name="paymentPaidAt" value={payPaidAt} />
            <input type="hidden" name="paymentMethod" value={payMethod} />
            <input type="hidden" name="paymentDescription" value={payDescription} />
            <input type="hidden" name="paymentNotes" value={payNotes} />
            <input type="hidden" name="paymentTeacherShareSom" value={payKind === PaymentKind.DAILY ? payTeacherShareSom : ""} />
            <input type="hidden" name="paymentSubscriptionLessonCount" value={payKind === PaymentKind.SUBSCRIPTION ? paySubLessons : ""} />
            <input type="hidden" name="paymentTeacherSharePerLessonSom" value={payKind === PaymentKind.SUBSCRIPTION ? paySubPerLesson : ""} />

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--ink-soft)]" htmlFor="planner-notes">
                Barcha tanlangan darslar uchun umumiy izoh (ixtiyoriy)
              </label>
              <textarea
                id="planner-notes"
                name="notes"
                rows={2}
                className="w-full rounded-2xl border border-zinc-200/90 bg-white/80 px-4 py-3 text-[var(--ink)] shadow-inner shadow-black/5 outline-none focus:border-teal-300 focus:ring-4 focus:ring-teal-500/15"
                placeholder="Masalan: mart oyi paketi"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={
                  pending ||
                  slotsPayload.length === 0 ||
                  (payKind === PaymentKind.SUBSCRIPTION &&
                    subscriptionPackSize != null &&
                    slotsPayload.length !== subscriptionPackSize)
                }
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 transition hover:brightness-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                Tasdiqlash — {slotsPayload.length} ta darsni jadvalga qo‘shish
              </button>
              {slotsPayload.length === 0 ? (
                <span className="text-sm text-[var(--muted)]">Kamida bitta bo‘sh slot tanlang.</span>
              ) : payKind === PaymentKind.SUBSCRIPTION &&
                subscriptionPackSize != null &&
                slotsPayload.length !== subscriptionPackSize ? (
                <span className="text-sm text-violet-900">
                  {slotsPayload.length < subscriptionPackSize ? (
                    <>
                      Abonentlik uchun yana {subscriptionPackSize - slotsPayload.length} ta slot tanlang (jami{" "}
                      {subscriptionPackSize} ta kerak).
                    </>
                  ) : (
                    <>
                      Tanlangan slotlar ({slotsPayload.length}) abonentlikdagi darslar sonidan ({subscriptionPackSize})
                      oshmasin — ortiqchasini bekor qiling.
                    </>
                  )}
                </span>
              ) : null}
            </div>
          </form>
        </div>
      ) : teacherId && studentId && !scheduleUnlocked ? null : (
        <p className="rounded-2xl border border-zinc-100 bg-zinc-50/50 px-4 py-3 text-sm text-[var(--muted)]">
          Avval <strong>o‘qituvchi</strong> va <strong>o‘quvchini</strong> tanlang, keyin <strong>to‘lov</strong>ni
          kiriting — undan keyin haftalik jadval ochiladi.
        </p>
      )}
    </div>
  );
}
