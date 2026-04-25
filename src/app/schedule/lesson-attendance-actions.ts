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
  rescheduleUrl?: string;
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
      startMinutes: true,
      teacherId: true,
      studentId: true,
      kind: true,
      consumedSubscriptionPaymentId: true,
      attendance: true,
      guardianFee: true,
      settlementSom: true,
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

  if (lesson.attendance === LessonAttendance.ABSENT) {
    return {
      error: "«Darsga kelmadi» allaqachon belgilangan. Buni o‘zgartirib bo‘lmaydi.",
      success: false,
    };
  }

  if (lesson.attendance === LessonAttendance.PRESENT) {
    if (data.attendance !== LessonAttendance.PRESENT) {
      return {
        error: "«Darsga keldi» belgilangan. Keldi / kelmadi holatini keyin o‘zgartirib bo‘lmaydi.",
        success: false,
      };
    }

    if (lesson.guardianFee === LessonGuardianFee.PAID) {
      return {
        error: "To‘lov «qildi» deb belgilangan. Buni o‘zgartirib bo‘lmaydi.",
        success: false,
      };
    }

    if (lesson.guardianFee === LessonGuardianFee.UNPAID) {
      if (data.guardianFee !== LessonGuardianFee.PAID) {
        return {
          error:
            "To‘lov hali «qarz». Faqat keyinroq «to‘lov qildi» deb yangilash mumkin (boshqa o‘zgartirish yo‘q).",
          success: false,
        };
      }

      if (lesson.settlementSom == null) {
        return {
          error: "Dars bo‘yicha hisob topilmadi. Administratorga murojaat qiling.",
          success: false,
        };
      }

      try {
        await prisma.$transaction(async (tx) => {
          await tx.studentDebt.deleteMany({ where: { lessonId: lesson.id } });

          await tx.teacherLessonEarning.upsert({
            where: { lessonId: lesson.id },
            create: {
              lessonId: lesson.id,
              teacherId: lesson.teacherId,
              amountSom: lesson.settlementSom!,
              payer: TeacherEarningPayer.GUARDIAN,
            },
            update: {
              amountSom: lesson.settlementSom!,
              payer: TeacherEarningPayer.GUARDIAN,
              teacherId: lesson.teacherId,
            },
          });

          await tx.lesson.update({
            where: { id: lesson.id },
            data: { guardianFee: LessonGuardianFee.PAID },
          });
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Saqlashda xatolik";
        return { error: msg, success: false };
      }

      revalidatePath(SCHEDULE_LESSON_PATH);
      revalidatePath(SCHEDULE_CONSULTATION_PATH);
      revalidatePath(`/students/${lesson.studentId}`);
      revalidatePath(`/teachers/${lesson.teacherId}`);
      revalidatePath("/payments");

      return { success: true };
    }
  }

  if (lesson.attendance !== LessonAttendance.UNMARKED) {
    return { error: "Bu dars holati allaqachon belgilangan.", success: false };
  }

  const markedAt = new Date();
  const dateStr = lesson.lessonDate.toISOString().slice(0, 10);
  const nextDate = new Date(lesson.lessonDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const nextDateIso = nextDate.toISOString().slice(0, 10);
  let shouldSuggestReschedule = false;

  try {
    await prisma.$transaction(async (tx) => {
      if (data.attendance === LessonAttendance.ABSENT) {
        const current = await tx.lesson.findUnique({
          where: { id: lesson.id },
          select: { consumedSubscriptionPaymentId: true },
        });
        const hasOpenSubscription = await tx.payment.findFirst({
          where: {
            studentId: lesson.studentId,
            kind: PaymentKind.SUBSCRIPTION,
            subscriptionLessonsRemaining: { gt: 0 },
          },
          select: { id: true },
        });
        if (current?.consumedSubscriptionPaymentId) {
          await tx.payment.update({
            where: { id: current.consumedSubscriptionPaymentId },
            data: { subscriptionLessonsRemaining: { increment: 1 } },
          });
          shouldSuggestReschedule = true;
        } else if (hasOpenSubscription && lesson.kind === LessonKind.LESSON) {
          // Bu dars abonentlik oqimida bo‘lgan, lekin hali consume qilinmagan bo‘lishi mumkin.
          shouldSuggestReschedule = true;
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

      const isConsultationFlow = lesson.kind === LessonKind.CONSULTATION;

      if (!isConsultationFlow && resolved.earningAmount <= 0) {
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
      const isSubscriptionFlow = Boolean(resolved.subscriptionPaymentToDecrement || consumedPaymentId);

      if (!isSubscriptionFlow && !isConsultationFlow && gf !== LessonGuardianFee.PAID && gf !== LessonGuardianFee.UNPAID) {
        throw new Error("BATCH:To‘lov holatini tanlang.");
      }

      await tx.lesson.update({
        where: { id: lesson.id },
        data: {
          attendance: LessonAttendance.PRESENT,
          guardianFee: isConsultationFlow
            ? LessonGuardianFee.PAID
            : isSubscriptionFlow
              ? LessonGuardianFee.NA
              : gf,
          settlementSom: earningAmount,
          attendanceMarkedAt: markedAt,
          consumedSubscriptionPaymentId: consumedPaymentId,
        },
      });

      if (isConsultationFlow) {
        await tx.studentDebt.deleteMany({ where: { lessonId: lesson.id } });
        await tx.teacherLessonEarning.deleteMany({ where: { lessonId: lesson.id } });
      } else if (isSubscriptionFlow) {
        await tx.studentDebt.deleteMany({ where: { lessonId: lesson.id } });

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
      } else if (gf === LessonGuardianFee.PAID) {
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
      } else {
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

  return {
    success: true,
    rescheduleUrl: shouldSuggestReschedule
      ? `/schedule/new?teacherId=${encodeURIComponent(lesson.teacherId)}&studentId=${encodeURIComponent(lesson.studentId)}&lessonDate=${nextDateIso}&startMinutes=${lesson.startMinutes}&reuseSubscription=1`
      : undefined,
  };
}
