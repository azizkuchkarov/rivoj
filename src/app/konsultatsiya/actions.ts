"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { LessonKind, PaymentKind, PaymentMethod } from "@/generated/prisma/enums";
import { bookLesson } from "@/lib/lesson-booking";
import { prisma } from "@/lib/prisma";
import { SCHEDULE_CONSULTATION_PATH, SCHEDULE_LESSON_PATH } from "@/lib/schedule-paths";
import { startOfWeekMondayUTC, toISODateStringUTC } from "@/lib/week-utils";
import { consultationIntakeSchema } from "@/lib/validations/consultation-intake";

export type TeacherDayBlock = {
  kind: "LESSON" | "CONSULTATION";
  kindLabel: string;
  startMinutes: number;
  endMinutes: number;
  studentName: string;
};

export type ConsultationIntakeState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function normalizeFullName(fullName: string): string {
  return fullName.trim().replace(/\s+/g, " ");
}

export async function getTeacherDayScheduleForIntake(
  teacherId: string,
  dateYmd: string,
): Promise<{ ok: true; blocks: TeacherDayBlock[] } | { ok: false; error: string }> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) {
    return { ok: false, error: "Sana noto‘g‘ri" };
  }
  if (!teacherId.trim()) {
    return { ok: false, error: "O‘qituvchi tanlanmagan" };
  }

  try {
    const lessonDate = new Date(`${dateYmd}T00:00:00.000Z`);
    const rows = await prisma.lesson.findMany({
      where: { teacherId, lessonDate },
      select: {
        kind: true,
        startMinutes: true,
        endMinutes: true,
        student: { select: { fullName: true } },
      },
      orderBy: { startMinutes: "asc" },
    });

    return {
      ok: true,
      blocks: rows.map((r) => ({
        kind: r.kind,
        kindLabel: r.kind === LessonKind.LESSON ? "Dars" : "Konsultatsiya",
        startMinutes: r.startMinutes,
        endMinutes: r.endMinutes,
        studentName: r.student.fullName,
      })),
    };
  } catch {
    return { ok: false, error: "Ma’lumotni yuklashda xatolik" };
  }
}

function intakeFormToObject(formData: FormData) {
  return {
    fullName: String(formData.get("fullName") ?? ""),
    group: String(formData.get("group") ?? ""),
    guardianName: String(formData.get("guardianName") ?? ""),
    guardianPhone: String(formData.get("guardianPhone") ?? ""),
    teacherId: String(formData.get("teacherId") ?? ""),
    lessonDate: String(formData.get("lessonDate") ?? ""),
    startMinutes: String(formData.get("startMinutes") ?? ""),
    consultationAmountSom: String(formData.get("consultationAmountSom") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

export async function registerConsultationIntake(
  _prev: ConsultationIntakeState,
  formData: FormData,
): Promise<ConsultationIntakeState> {
  const parsed = consultationIntakeSchema.safeParse(intakeFormToObject(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;
  const normalizedFullName = normalizeFullName(data.fullName);

  const existingByName = await prisma.student.findFirst({
    where: { fullName: { equals: normalizedFullName, mode: "insensitive" } },
    select: { id: true },
  });
  if (existingByName) {
    return { error: "Bunday ism-familiyali o‘quvchi allaqachon mavjud." };
  }

  let studentId: string;
  try {
    const created = await prisma.student.create({
      data: {
        fullName: normalizedFullName,
        group: data.group,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        isActive: true,
        focusAreas: [],
      },
    });
    studentId = created.id;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "O‘quvchini yaratib bo‘lmadi";
    return { error: msg };
  }

  const result = await bookLesson({
    kind: LessonKind.CONSULTATION,
    lessonDateYmd: data.lessonDate,
    startMinutes: data.startMinutes,
    teacherId: data.teacherId,
    studentId,
    notes: data.notes,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  try {
    const createdLesson = await prisma.lesson.findFirst({
      where: {
        kind: LessonKind.CONSULTATION,
        lessonDate: new Date(`${data.lessonDate}T00:00:00.000Z`),
        startMinutes: data.startMinutes,
        teacherId: data.teacherId,
        studentId,
      },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });

    if (!createdLesson) {
      return { error: "Konsultatsiya saqlandi, lekin to‘lov yozuvini topib bo‘lmadi." };
    }

    await prisma.payment.upsert({
      where: { lessonId: createdLesson.id },
      create: {
        studentId,
        lessonId: createdLesson.id,
        kind: PaymentKind.DAILY,
        amountSom: data.consultationAmountSom,
        paidAt: new Date(`${data.lessonDate}T12:00:00.000Z`),
        method: PaymentMethod.CASH,
        description: "Konsultatsiya to‘lovi",
        notes: data.notes,
        teacherId: null,
        teacherShareSom: 0,
        subscriptionLessonCount: null,
        teacherSharePerLessonSom: null,
        subscriptionLessonsRemaining: null,
      },
      update: {
        amountSom: data.consultationAmountSom,
        paidAt: new Date(`${data.lessonDate}T12:00:00.000Z`),
        method: PaymentMethod.CASH,
        description: "Konsultatsiya to‘lovi",
        notes: data.notes,
        teacherId: null,
        teacherShareSom: 0,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Konsultatsiya to‘lovi saqlanmadi";
    return { error: msg };
  }

  revalidatePath(SCHEDULE_CONSULTATION_PATH);
  revalidatePath(SCHEDULE_LESSON_PATH);
  revalidatePath("/students");
  revalidatePath("/payments");
  revalidatePath("/hisob-kitob");

  const monday = startOfWeekMondayUTC(new Date(`${data.lessonDate}T12:00:00.000Z`));
  const weekIso = toISODateStringUTC(monday);
  redirect(`${SCHEDULE_CONSULTATION_PATH}?view=week&week=${weekIso}`);
}
