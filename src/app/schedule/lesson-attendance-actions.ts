"use server";

import { revalidatePath } from "next/cache";

import {
  LessonAttendance,
  LessonGuardianFee,
  LessonKind,
  PaymentKind,
  TeacherEarningPayer,
} from "@/generated/prisma/enums";
import { resolveLessonSettlementSom } from "@/lib/lesson-attendance-settlement";
import { prisma } from "@/lib/prisma";
import { SCHEDULE_CONSULTATION_PATH, SCHEDULE_LESSON_PATH } from "@/lib/schedule-paths";
import { markLessonAttendanceSchema } from "@/lib/validations/lesson-attendance";

export type LessonAttendanceActionState = {
  error?: string;
  success?: boolean;
};

function formDataToObject(formData: FormData) {
  return {
    lessonId: String(formData.get("lessonId") ?? ""),
    attendance: String(formData.get("attendance") ?? ""),
    guardianFee: String(formData.get("guardianFee") ?? ""),
  };
}

export async function markLessonAttendance(
  _prev: LessonAttendanceActionState,
  formData: FormData,
): Promise<LessonAttendanceActionState> {
  const raw = formDataToObject(formData);
  const guardianFeeEmpty =
    raw.guardianFee === "" || raw.guardianFee === "NA"
      ? undefined
      : (raw.guardianFee as "PAID" | "UNPAID");

  const lesson = await prisma.lesson.findUnique({
    where: { id: raw.lessonId },
    select: {
      id: true,
      lessonDate: true,
      teacherId: true,
      studentId: true,
      kind: true,
      consumedSubscriptionPaymentId: true,
    },
  });

  if (!lesson) {
    return { error: "Dars topilmadi.", success: false };
  }

  const parsed = markLessonAttendanceSchema.safeParse({
    lessonId: raw.lessonId,
    attendance: raw.attendance,
    guardianFee: guardianFeeEmpty,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Ma’lumotlar noto‘g‘ri.", success: false };
  }

  const data = parsed.data;

  const markedAt = new Date();
  const dateStr = lesson.lessonDate.toISOString().slice(0, 10);

  try {
    await prisma.$transaction(async (tx) => {
      if (data.attendance === LessonAttendance.ABSENT) {
        const current = await tx.lesson.findUnique({
          where: { id: lesson.id },
          select: { consumedSubscriptionPaymentId: true },
        });
        if (current?.consumedSubscriptionPaymentId) {
          await tx.payment.update({
            where: { id: current.consumedSubscriptionPaymentId },
            data: { subscriptionLessonsRemaining: { increment: 1 } },
          });
        }
        await tx.payment.deleteMany({ where: { lessonId: lesson.id } });
        await tx.studentDebt.deleteMany({ where: { lessonId: lesson.id } });
        await tx.teacherLessonEarning.deleteMany({ where: { lessonId: lesson.id } });

        await tx.lesson.update({
          where: { id: lesson.id },
          data: {
            attendance: LessonAttendance.ABSENT,
            guardianFee: LessonGuardianFee.NA,
            settlementSom: null,
            attendanceMarkedAt: markedAt,
            consumedSubscriptionPaymentId: null,
          },
        });
        return;
      }

      const gf = data.guardianFee!;

      const resolved = await resolveLessonSettlementSom(tx, {
        studentId: lesson.studentId,
        kind: lesson.kind,
        consumedSubscriptionPaymentId: lesson.consumedSubscriptionPaymentId,
      });

      if (resolved.earningAmount <= 0) {
        throw new Error(
          "BATCH:O‘qituvchi ulushi topilmadi. Avval «Yangi dars» yoki to‘lov (kunlik / abonentlik) kiritilgan bo‘lsin.",
        );
      }

      if (resolved.subscriptionPaymentToDecrement) {
        await tx.payment.update({
          where: { id: resolved.subscriptionPaymentToDecrement },
          data: { subscriptionLessonsRemaining: { decrement: 1 } },
        });
      }

      const earningAmount = resolved.earningAmount;
      const consumedPaymentId = resolved.consumedSubscriptionPaymentId;

      await tx.lesson.update({
        where: { id: lesson.id },
        data: {
          attendance: LessonAttendance.PRESENT,
          guardianFee: gf,
          settlementSom: earningAmount,
          attendanceMarkedAt: markedAt,
          consumedSubscriptionPaymentId: consumedPaymentId,
        },
      });

      if (gf === LessonGuardianFee.PAID) {
        await tx.studentDebt.deleteMany({ where: { lessonId: lesson.id } });

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
      } else {
        await tx.payment.deleteMany({ where: { lessonId: lesson.id } });

        const guardianDebtSom = resolved.guardianDebtAmountSom;

        await tx.studentDebt.upsert({
          where: { lessonId: lesson.id },
          create: {
            studentId: lesson.studentId,
            lessonId: lesson.id,
            amountSom: guardianDebtSom,
            note: `Dars ${dateStr}: keldi, to‘lov kutilmoqda (o‘quvchi to‘lovi)`,
          },
          update: {
            amountSom: guardianDebtSom,
            studentId: lesson.studentId,
          },
        });

        await tx.teacherLessonEarning.upsert({
          where: { lessonId: lesson.id },
          create: {
            lessonId: lesson.id,
            teacherId: lesson.teacherId,
            amountSom: earningAmount,
            payer: TeacherEarningPayer.CENTER,
          },
          update: {
            amountSom: earningAmount,
            payer: TeacherEarningPayer.CENTER,
            teacherId: lesson.teacherId,
          },
        });
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Saqlashda xatolik";
    if (msg.startsWith("BATCH:")) {
      return { error: msg.slice(6), success: false };
    }
    return { error: msg, success: false };
  }

  revalidatePath(SCHEDULE_LESSON_PATH);
  revalidatePath(SCHEDULE_CONSULTATION_PATH);
  revalidatePath(`/students/${lesson.studentId}`);
  revalidatePath(`/teachers/${lesson.teacherId}`);
  revalidatePath("/payments");

  return { success: true };
}
