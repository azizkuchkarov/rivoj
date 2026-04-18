"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { LessonAttendance, LessonGuardianFee, TeacherEarningPayer } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { studentFormSchema } from "@/lib/validations/student";

export type StudentActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function formDataToObject(formData: FormData) {
  return {
    fullName: String(formData.get("fullName") ?? ""),
    dateOfBirth: String(formData.get("dateOfBirth") ?? ""),
    gender: String(formData.get("gender") ?? ""),
    guardianName: String(formData.get("guardianName") ?? ""),
    guardianPhone: String(formData.get("guardianPhone") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    focusAreas: String(formData.get("focusAreas") ?? ""),
    primaryTeacherId: String(formData.get("primaryTeacherId") ?? ""),
    isActive: formData.get("isActive") === "true" ? "true" : "false",
  };
}

export async function createStudent(
  _prev: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const parsed = studentFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;
  if (data.primaryTeacherId) {
    const t = await prisma.teacher.findUnique({ where: { id: data.primaryTeacherId } });
    if (!t) {
      return { error: "Tanlangan o‘qituvchi topilmadi." };
    }
  }

  let student;
  try {
    student = await prisma.student.create({
      data: {
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        notes: data.notes,
        focusAreas: data.focusAreas,
        isActive: data.isActive,
        primaryTeacherId: data.primaryTeacherId ?? null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Saqlashda xatolik";
    return { error: msg };
  }
  revalidatePath("/students");
  redirect(`/students/${student.id}`);
}

export async function updateStudent(
  id: string,
  _prev: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const parsed = studentFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;
  if (data.primaryTeacherId) {
    const t = await prisma.teacher.findUnique({ where: { id: data.primaryTeacherId } });
    if (!t) {
      return { error: "Tanlangan o‘qituvchi topilmadi." };
    }
  }

  try {
    await prisma.student.update({
      where: { id },
      data: {
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        notes: data.notes,
        focusAreas: data.focusAreas,
        isActive: data.isActive,
        primaryTeacherId: data.primaryTeacherId ?? null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Yangilashda xatolik";
    return { error: msg };
  }
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  revalidatePath(`/students/${id}/edit`);
  redirect(`/students/${id}`);
}

export async function deleteStudent(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/students");
  try {
    await prisma.student.delete({ where: { id } });
  } catch {
    redirect(`/students/${id}`);
  }
  revalidatePath("/students");
  revalidatePath("/schedule");
  revalidatePath("/konsultatsiya");
  revalidatePath("/konsultatsiya/qabul");
  revalidatePath("/payments");
  redirect("/students");
}

/**
 * O‘quvchi profilidan: kelgan dars uchun ota-ona to‘lovini qabul qilindi deb belgilash (qarzni yopish).
 */
export async function markGuardianFeePaid(formData: FormData) {
  const lessonId = String(formData.get("lessonId") ?? "").trim();
  const studentId = String(formData.get("studentId") ?? "").trim();
  if (!lessonId || !studentId) {
    redirect("/students");
  }

  let teacherId: string | null = null;
  try {
    teacherId = await prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.findFirst({
        where: {
          id: lessonId,
          studentId,
          attendance: LessonAttendance.PRESENT,
          guardianFee: LessonGuardianFee.UNPAID,
        },
        select: {
          id: true,
          studentId: true,
          teacherId: true,
          settlementSom: true,
        },
      });

      if (!lesson) {
        throw new Error("noop");
      }

      const earningAmount = lesson.settlementSom ?? 0;
      if (earningAmount <= 0) {
        throw new Error("noop");
      }

      await tx.studentDebt.deleteMany({ where: { lessonId: lesson.id } });

      await tx.lesson.update({
        where: { id: lesson.id },
        data: { guardianFee: LessonGuardianFee.PAID },
      });

      await tx.teacherLessonEarning.upsert({
        where: { lessonId: lesson.id },
        create: {
          lessonId: lesson.id,
          teacherId: lesson.teacherId,
          amountSom: earningAmount,
          payer: TeacherEarningPayer.GUARDIAN,
        },
        update: {
          amountSom: earningAmount,
          payer: TeacherEarningPayer.GUARDIAN,
          teacherId: lesson.teacherId,
        },
      });

      await tx.payment.deleteMany({ where: { lessonId: lesson.id } });

      return lesson.teacherId;
    });
  } catch {
    redirect(`/students/${studentId}`);
  }

  revalidatePath("/schedule");
  revalidatePath("/konsultatsiya");
  revalidatePath("/payments");
  revalidatePath(`/students/${studentId}`);
  if (teacherId) {
    revalidatePath(`/teachers/${teacherId}`);
  }
  redirect(`/students/${studentId}`);
}
