"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { sendTeachersTomorrowSchedules } from "@/lib/telegram-schedule";
import { teacherFormSchema } from "@/lib/validations/teacher";

export type TeacherActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type TeacherTelegramTestActionState = {
  error?: string;
  success?: string;
};

/**
 * Bitta o‘qituvchining № si o‘zgarganda qolganlar avtomatik siljiydi.
 * Eski raqam 0 yoki noto‘g‘ri bo‘lsa, yangi № ga "kiritish" kabi hisoblanadi.
 */
async function shiftForTeacherMove(tx: Prisma.TransactionClient, id: string, oldNum: number, newNum: number) {
  if (newNum === oldNum) return;

  if (oldNum < 1) {
    await tx.teacher.updateMany({
      where: { id: { not: id }, listNumber: { gte: newNum } },
      data: { listNumber: { increment: 1 } },
    });
    return;
  }

  if (newNum < oldNum) {
    await tx.teacher.updateMany({
      where: { id: { not: id }, listNumber: { gte: newNum, lt: oldNum } },
      data: { listNumber: { increment: 1 } },
    });
    return;
  }

  await tx.teacher.updateMany({
    where: { id: { not: id }, listNumber: { gt: oldNum, lte: newNum } },
    data: { listNumber: { increment: -1 } },
  });
}

function formDataToObject(formData: FormData) {
  return {
    listNumber: String(formData.get("listNumber") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    title: String(formData.get("title") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    telegramChatId: String(formData.get("telegramChatId") ?? ""),
    photoUrl: String(formData.get("photoUrl") ?? ""),
    specialties: String(formData.get("specialties") ?? ""),
    experienceYears: String(formData.get("experienceYears") ?? ""),
    isActive: formData.get("isActive") === "true" ? "true" : "false",
    offersConsultation: formData.get("offersConsultation") === "true" ? "true" : "false",
  };
}

export async function createTeacher(
  _prev: TeacherActionState,
  formData: FormData,
): Promise<TeacherActionState> {
  const parsed = teacherFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;

  let teacher;
  try {
    teacher = await prisma.$transaction(async (tx) => {
      await tx.teacher.updateMany({
        where: { listNumber: { gte: data.listNumber } },
        data: { listNumber: { increment: 1 } },
      });
      return tx.teacher.create({
        data: {
          listNumber: data.listNumber,
          fullName: data.fullName,
          title: data.title,
          phone: data.phone,
          telegramChatId: data.telegramChatId,
          photoUrl: data.photoUrl,
          specialties: data.specialties,
          experienceYears: data.experienceYears,
          isActive: data.isActive,
          offersConsultation: data.offersConsultation,
        },
      });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Saqlashda xatolik";
    return { error: msg };
  }
  revalidatePath("/teachers");
  revalidatePath("/schedule");
  revalidatePath("/konsultatsiya");
  redirect(`/teachers/${teacher.id}`);
}

export async function updateTeacher(
  id: string,
  _prev: TeacherActionState,
  formData: FormData,
): Promise<TeacherActionState> {
  const parsed = teacherFormSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;

  let existing;
  try {
    existing = await prisma.teacher.findUnique({ where: { id }, select: { listNumber: true } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ma’lumotni o‘qishda xatolik";
    return { error: msg };
  }
  if (!existing) {
    return { error: "O‘qituvchi topilmadi." };
  }

  const oldNum = existing.listNumber;

  try {
    await prisma.$transaction(async (tx) => {
      await shiftForTeacherMove(tx, id, oldNum, data.listNumber);
      await tx.teacher.update({
        where: { id },
        data: {
          listNumber: data.listNumber,
          fullName: data.fullName,
          title: data.title,
          phone: data.phone,
          telegramChatId: data.telegramChatId,
          photoUrl: data.photoUrl,
          specialties: data.specialties,
          experienceYears: data.experienceYears,
          isActive: data.isActive,
          offersConsultation: data.offersConsultation,
        },
      });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Yangilashda xatolik";
    return { error: msg };
  }
  revalidatePath("/teachers");
  revalidatePath("/schedule");
  revalidatePath("/konsultatsiya");
  revalidatePath(`/teachers/${id}`);
  revalidatePath(`/teachers/${id}/edit`);
  redirect(`/teachers/${id}`);
}

export async function deleteTeacher(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/teachers");
  try {
    await prisma.teacher.delete({ where: { id } });
  } catch {
    redirect(`/teachers/${id}`);
  }
  revalidatePath("/teachers");
  revalidatePath("/schedule");
  revalidatePath("/konsultatsiya");
  revalidatePath("/konsultatsiya/qabul");
  revalidatePath("/students");
  redirect("/teachers");
}

export async function sendTeacherTelegramTest(
  _prev: TeacherTelegramTestActionState,
  formData: FormData,
): Promise<TeacherTelegramTestActionState> {
  const teacherId = String(formData.get("teacherId") ?? "").trim();
  if (!teacherId) return { error: "O‘qituvchi topilmadi." };

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { fullName: true, telegramChatId: true },
  });
  if (!teacher) return { error: "O‘qituvchi topilmadi." };
  if (!teacher.telegramChatId) {
    return { error: "Telegram chat ID kiritilmagan." };
  }

  const stats = await sendTeachersTomorrowSchedules({ teacherId });
  if (stats.sent < 1) {
    return { error: "Ertangi kun jadvali yuborilmadi. Telegram ID yoki jadvalni tekshiring." };
  }
  return { success: "Ertangi kun jadvali test tariqasida yuborildi." };
}
