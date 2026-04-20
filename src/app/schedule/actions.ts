"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { z } from "zod";

import { LessonKind, PaymentKind } from "@/generated/prisma/enums";
import { bookLesson, bookLessonsBatchWithDb } from "@/lib/lesson-booking";
import { prisma } from "@/lib/prisma";
import { sendTelegramTextByPhone } from "@/lib/telegram";
import { paymentFormSchema } from "@/lib/validations/payment";
import { SCHEDULE_CONSULTATION_PATH, SCHEDULE_LESSON_PATH, normalizeScheduleReturnBase } from "@/lib/schedule-paths";
import { addDaysUTC, parseWeekMondayParam, startOfWeekMondayUTC, toISODateStringUTC } from "@/lib/week-utils";
import { getSlotStartMinutesList } from "@/lib/time-minutes";
import { lessonFormSchema } from "@/lib/validations/lesson";

export type LessonActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type LessonBatchActionState = {
  error?: string;
};

export type PlannerLessonCell = {
  id: string;
  lessonDateIso: string;
  startMinutes: number;
  endMinutes: number;
  teacherId: string;
  studentId: string;
  studentName: string;
  teacherShort: string;
  kind: LessonKind;
};

function formatClock(startMinutes: number): string {
  const h = Math.floor(startMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (startMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Yangi dars rejalashtiruvchi: tanlangan haftada o‘qituvchi yoki o‘quvchiga tegishli barcha bandliklar */
export async function getLessonPlannerData(
  teacherId: string,
  studentId: string,
  weekMondayIso: string,
): Promise<{ lessons: PlannerLessonCell[] }> {
  if (!teacherId.trim() || !studentId.trim()) {
    return { lessons: [] };
  }
  const monday = parseWeekMondayParam(weekMondayIso);
  const sunday = addDaysUTC(monday, 6);
  const rows = await prisma.lesson.findMany({
    where: {
      lessonDate: { gte: monday, lte: sunday },
      OR: [{ teacherId }, { studentId }],
    },
    include: {
      teacher: { select: { listNumber: true, fullName: true } },
      student: { select: { fullName: true } },
    },
    orderBy: [{ lessonDate: "asc" }, { startMinutes: "asc" }],
  });

  return {
    lessons: rows.map((L) => ({
      id: L.id,
      lessonDateIso: L.lessonDate.toISOString().slice(0, 10),
      startMinutes: L.startMinutes,
      endMinutes: L.endMinutes,
      teacherId: L.teacherId,
      studentId: L.studentId,
      studentName: L.student.fullName,
      teacherShort: `№${L.teacher.listNumber} ${L.teacher.fullName}`,
      kind: L.kind,
    })),
  };
}

const ALLOWED_STARTS = new Set(getSlotStartMinutesList());

const batchSlotsSchema = z
  .array(
    z.object({
      lessonDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      startMinutes: z.number().int(),
    }),
  )
  .min(1)
  .max(100)
  .superRefine((arr, ctx) => {
    for (const [i, s] of arr.entries()) {
      if (!ALLOWED_STARTS.has(s.startMinutes)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ruxsat etilmagan slot",
          path: [i, "startMinutes"],
        });
      }
    }
  });

export async function createLessonBatch(
  _prev: LessonBatchActionState,
  formData: FormData,
): Promise<LessonBatchActionState> {
  const teacherId = String(formData.get("teacherId") ?? "").trim();
  const studentId = String(formData.get("studentId") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();
  let slotsJson: unknown;
  try {
    slotsJson = JSON.parse(String(formData.get("slotsJson") ?? "null"));
  } catch {
    return { error: "Slotlar ro‘yxati noto‘g‘ri." };
  }

  const parsed = z
    .object({
      teacherId: z.string().min(1, "O‘qituvchini tanlang"),
      studentId: z.string().min(1, "O‘quvchini tanlang"),
      notes: z.string().max(2000).optional(),
      slots: batchSlotsSchema,
    })
    .safeParse({
      teacherId,
      studentId,
      notes: notesRaw === "" ? undefined : notesRaw,
      slots: slotsJson,
    });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Ma’lumotlarni tekshiring." };
  }

  const { slots, notes: lessonNotes } = parsed.data;
  const reuseSubscription = String(formData.get("reuseSubscription") ?? "0") === "1";

  let pay: ReturnType<typeof paymentFormSchema.parse> | null = null;
  if (!reuseSubscription) {
    const payParsed = paymentFormSchema.safeParse({
      studentId,
      teacherId,
      kind: String(formData.get("paymentKind") ?? PaymentKind.DAILY),
      amountSom: String(formData.get("paymentAmountSom") ?? ""),
      paidAt: String(formData.get("paymentPaidAt") ?? ""),
      method: String(formData.get("paymentMethod") ?? "CASH"),
      description: String(formData.get("paymentDescription") ?? "").trim() || undefined,
      notes: String(formData.get("paymentNotes") ?? "").trim() || undefined,
      teacherShareSom: String(formData.get("paymentTeacherShareSom") ?? ""),
      subscriptionLessonCount: String(formData.get("paymentSubscriptionLessonCount") ?? ""),
      teacherSharePerLessonSom: String(formData.get("paymentTeacherSharePerLessonSom") ?? ""),
      redirectAfter: "payments",
    });

    if (!payParsed.success) {
      const first = payParsed.error.issues[0];
      return { error: first?.message ?? "To‘lov ma’lumotlarini tekshiring." };
    }

    pay = payParsed.data;

    if (pay.kind === PaymentKind.SUBSCRIPTION) {
      const n = pay.subscriptionLessonCount!;
      if (slots.length !== n) {
        return {
          error: `Abonentlik: ${n} ta dars uchun to‘lov kiritilgan — jadvalda ham aynan ${n} ta vaqt tanlang (hozir ${slots.length} ta). Bir nechta haftada tanlash mumkin; hafta o‘zgartirganda tanlovlar saqlanadi.`,
        };
      }
    }
  }

  try {
    let createdLessonIds: string[] = [];
    await prisma.$transaction(async (tx) => {
      let teacherShareSom: number | null = null;
      let subscriptionLessonCount: number | null = null;
      let teacherSharePerLessonSom: number | null = null;
      let subscriptionLessonsRemaining: number | null = null;

      if (pay) {
        if (pay.kind === PaymentKind.DAILY) {
          teacherShareSom = pay.teacherShareSom ?? 0;
        } else {
          subscriptionLessonCount = pay.subscriptionLessonCount!;
          teacherSharePerLessonSom = pay.teacherSharePerLessonSom!;
          teacherShareSom = subscriptionLessonCount * teacherSharePerLessonSom;
          subscriptionLessonsRemaining = subscriptionLessonCount;
        }
      }

      const descDefault = pay?.description ?? (lessonNotes ? `Dars jadvali: ${lessonNotes}` : `Dars jadvali — ${slots.length} ta vaqt`);

      const batch = await bookLessonsBatchWithDb(tx, {
        kind: LessonKind.LESSON,
        teacherId,
        studentId,
        slots: slots.map((s) => ({ lessonDateYmd: s.lessonDate, startMinutes: s.startMinutes })),
        notes: lessonNotes ?? null,
      });
      if (!batch.ok) {
        throw new Error(`BATCH:${batch.error}`);
      }
      createdLessonIds = batch.createdLessons.map((L) => L.id);

      if (pay?.kind === PaymentKind.DAILY) {
        await Promise.all(
          batch.createdLessons.map((L) =>
            tx.payment.create({
              data: {
                studentId: pay.studentId,
                lessonId: L.id,
                kind: pay.kind,
                amountSom: pay.amountSom,
                paidAt: new Date(`${pay.paidAt}T12:00:00.000Z`),
                method: pay.method,
                description: descDefault,
                notes: pay.notes,
                teacherId,
                teacherShareSom,
                subscriptionLessonCount: null,
                teacherSharePerLessonSom: null,
                subscriptionLessonsRemaining: null,
              },
            }),
          ),
        );
      } else if (pay?.kind === PaymentKind.SUBSCRIPTION) {
        await tx.payment.create({
          data: {
            studentId: pay.studentId,
            kind: pay.kind,
            amountSom: pay.amountSom,
            paidAt: new Date(`${pay.paidAt}T12:00:00.000Z`),
            method: pay.method,
            description: descDefault,
            notes: pay.notes,
            teacherId,
            teacherShareSom,
            subscriptionLessonCount,
            teacherSharePerLessonSom,
            subscriptionLessonsRemaining,
          },
        });
      }
    });

    if (createdLessonIds.length > 0) {
      const createdLessons = await prisma.lesson.findMany({
        where: { id: { in: createdLessonIds } },
        include: {
          student: { select: { fullName: true, guardianPhone: true } },
          teacher: { select: { fullName: true } },
        },
        orderBy: [{ lessonDate: "asc" }, { startMinutes: "asc" }],
      });
      if (createdLessons.length > 0) {
        const first = createdLessons[0]!;
        const dateAndTimes = createdLessons
          .map((L) => `${L.lessonDate.toISOString().slice(0, 10)} ${formatClock(L.startMinutes)}`)
          .join(", ");
        const text =
          `Farzandingizga dars belgilandi.\n` +
          `O‘quvchi: ${first.student.fullName}\n` +
          `O‘qituvchi: ${first.teacher.fullName}\n` +
          `Vaqt(lar): ${dateAndTimes}`;
        await sendTelegramTextByPhone(first.student.guardianPhone, text);
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Saqlashda xatolik.";
    if (msg.startsWith("BATCH:")) {
      return { error: msg.slice(6) };
    }
    return { error: msg };
  }

  revalidatePath(SCHEDULE_LESSON_PATH);
  revalidatePath(SCHEDULE_CONSULTATION_PATH);
  revalidatePath("/payments");
  revalidatePath(`/students/${studentId}`);

  const firstSlot = [...slots].sort(
    (a, b) => a.lessonDate.localeCompare(b.lessonDate) || a.startMinutes - b.startMinutes,
  )[0]!;
  const monday = startOfWeekMondayUTC(new Date(`${firstSlot.lessonDate}T12:00:00.000Z`));
  const weekIso = toISODateStringUTC(monday);
  redirect(`/schedule?view=week&week=${weekIso}`);
}

function formDataToObject(formData: FormData) {
  return {
    lessonDate: String(formData.get("lessonDate") ?? ""),
    startMinutes: String(formData.get("startMinutes") ?? ""),
    teacherId: String(formData.get("teacherId") ?? ""),
    studentId: String(formData.get("studentId") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    kind: String(formData.get("kind") ?? LessonKind.LESSON),
  };
}

export async function createLesson(
  _prev: LessonActionState,
  formData: FormData,
): Promise<LessonActionState> {
  const parsed = lessonFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;
  const kind = data.kind;

  const result = await bookLesson({
    kind,
    lessonDateYmd: data.lessonDate,
    startMinutes: data.startMinutes,
    teacherId: data.teacherId,
    studentId: data.studentId,
    notes: data.notes,
  });
  if (!result.ok) {
    return { error: result.error };
  }

  try {
    const createdLesson = await prisma.lesson.findFirst({
      where: {
        kind,
        lessonDate: new Date(`${data.lessonDate}T00:00:00.000Z`),
        startMinutes: data.startMinutes,
        teacherId: data.teacherId,
        studentId: data.studentId,
      },
      include: {
        student: { select: { fullName: true, guardianPhone: true } },
        teacher: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    if (createdLesson) {
      const text =
        `Farzandingizga dars belgilandi.\n` +
        `O‘quvchi: ${createdLesson.student.fullName}\n` +
        `O‘qituvchi: ${createdLesson.teacher.fullName}\n` +
        `Vaqt: ${data.lessonDate} ${formatClock(createdLesson.startMinutes)}`;
      await sendTelegramTextByPhone(createdLesson.student.guardianPhone, text);
    }
  } catch {
    // Telegram yuborish xatosi dars saqlanishini to‘xtatmaydi
  }

  revalidatePath(SCHEDULE_LESSON_PATH);
  revalidatePath(SCHEDULE_CONSULTATION_PATH);
  const monday = startOfWeekMondayUTC(new Date(`${data.lessonDate}T12:00:00.000Z`));
  const weekIso = toISODateStringUTC(monday);
  const returnBase = kind === LessonKind.CONSULTATION ? SCHEDULE_CONSULTATION_PATH : SCHEDULE_LESSON_PATH;
  redirect(`${returnBase}?view=week&week=${weekIso}`);
}

export async function deleteLesson(formData: FormData) {
  const id = String(formData.get("lessonId") ?? "");
  const scheduleView = String(formData.get("scheduleView") ?? "week");
  const week = String(formData.get("week") ?? "");
  const date = String(formData.get("date") ?? "");
  const returnBase = normalizeScheduleReturnBase(String(formData.get("returnBase") ?? SCHEDULE_LESSON_PATH));
  if (!id) return;
  try {
    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { lessonId: id } }),
      prisma.lesson.delete({ where: { id } }),
    ]);
  } catch {
    return;
  }
  revalidatePath(SCHEDULE_LESSON_PATH);
  revalidatePath(SCHEDULE_CONSULTATION_PATH);
  if (scheduleView === "day" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    redirect(`${returnBase}?view=day&date=${date}`);
  }
  const w = week && /^\d{4}-\d{2}-\d{2}$/.test(week) ? week : undefined;
  redirect(`${returnBase}?view=week&week=${toISODateStringUTC(parseWeekMondayParam(w))}`);
}
