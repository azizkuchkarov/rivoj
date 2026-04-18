import { LessonKind, PaymentKind } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

type Tx = Pick<Prisma.TransactionClient, "payment">;

/**
 * «Yangi dars» kunlik to‘lovida tavsif: «Dars jadvali — N ta vaqt» → ulush N ta slotga bo‘linadi.
 */
export function perLessonFromDailyPlannerPayment(teacherShareSom: number, description: string | null): number {
  const m = (description ?? "").match(/—\s*(\d+)\s*ta\s*vaqt/);
  const n = m ? Math.max(1, Number.parseInt(m[1], 10)) : 1;
  return Math.max(0, Math.floor(teacherShareSom / n));
}

/** Kunlik to‘lov: o‘quvchi tomonidan bir dars uchun (slot) markazga to‘lanishi kerak bo‘lgan summa */
export function perLessonGuardianFromDailyPlannerPayment(amountSom: number, description: string | null): number {
  const m = (description ?? "").match(/—\s*(\d+)\s*ta\s*vaqt/);
  const n = m ? Math.max(1, Number.parseInt(m[1], 10)) : 1;
  return Math.max(0, Math.floor(amountSom / n));
}

function perLessonGuardianFromSubscription(amountSom: number, subscriptionLessonCount: number | null): number {
  const n = subscriptionLessonCount != null && subscriptionLessonCount > 0 ? subscriptionLessonCount : 1;
  return Math.max(0, Math.floor(amountSom / n));
}

/**
 * Kelgan dars uchun summa: avval abonentlik (paket), bo‘lmasa oxirgi kunlik to‘lov (reja) bo‘yicha.
 */
export async function resolveLessonSettlementSom(
  tx: Tx,
  lesson: {
    studentId: string;
    kind: LessonKind;
    consumedSubscriptionPaymentId: string | null;
  },
): Promise<{
  earningAmount: number;
  /** Vasiy qarzi: markazga to‘lanishi kerak bo‘lgan to‘liq dars summasi (o‘qituvchi ulushidan farq qiladi) */
  guardianDebtAmountSom: number;
  /** lesson.consumedSubscriptionPaymentId uchun yangi qiymat */
  consumedSubscriptionPaymentId: string | null;
  /** FIFO paketdan 1 dars yechish */
  subscriptionPaymentToDecrement: string | null;
}> {
  if (lesson.kind === LessonKind.LESSON) {
    if (lesson.consumedSubscriptionPaymentId) {
      const pay = await tx.payment.findUnique({
        where: { id: lesson.consumedSubscriptionPaymentId },
        select: {
          teacherSharePerLessonSom: true,
          kind: true,
          amountSom: true,
          subscriptionLessonCount: true,
        },
      });
      if (pay?.kind === PaymentKind.SUBSCRIPTION && pay.teacherSharePerLessonSom != null) {
        const g = perLessonGuardianFromSubscription(pay.amountSom, pay.subscriptionLessonCount);
        const earningAmount = pay.teacherSharePerLessonSom;
        return {
          earningAmount,
          guardianDebtAmountSom: g > 0 ? g : earningAmount,
          consumedSubscriptionPaymentId: lesson.consumedSubscriptionPaymentId,
          subscriptionPaymentToDecrement: null,
        };
      }
    }

    const pool = await tx.payment.findFirst({
      where: {
        studentId: lesson.studentId,
        kind: PaymentKind.SUBSCRIPTION,
        subscriptionLessonsRemaining: { gt: 0 },
      },
      orderBy: [{ paidAt: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        amountSom: true,
        subscriptionLessonCount: true,
        teacherSharePerLessonSom: true,
        subscriptionLessonsRemaining: true,
      },
    });

    if (
      pool &&
      (pool.subscriptionLessonsRemaining ?? 0) > 0 &&
      pool.teacherSharePerLessonSom != null
    ) {
      const g = perLessonGuardianFromSubscription(pool.amountSom, pool.subscriptionLessonCount);
      const earningAmount = pool.teacherSharePerLessonSom;
      return {
        earningAmount,
        guardianDebtAmountSom: g > 0 ? g : earningAmount,
        consumedSubscriptionPaymentId: pool.id,
        subscriptionPaymentToDecrement: pool.id,
      };
    }
  }

  const daily = await tx.payment.findFirst({
    where: {
      studentId: lesson.studentId,
      kind: PaymentKind.DAILY,
      teacherShareSom: { gt: 0 },
    },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
    select: { amountSom: true, teacherShareSom: true, description: true },
  });

  if (daily) {
    const earningAmount = perLessonFromDailyPlannerPayment(daily.teacherShareSom ?? 0, daily.description);
    const guardianDebtAmountSom = perLessonGuardianFromDailyPlannerPayment(
      daily.amountSom ?? 0,
      daily.description,
    );
    return {
      earningAmount,
      guardianDebtAmountSom: guardianDebtAmountSom > 0 ? guardianDebtAmountSom : earningAmount,
      consumedSubscriptionPaymentId: null,
      subscriptionPaymentToDecrement: null,
    };
  }

  return {
    earningAmount: 0,
    guardianDebtAmountSom: 0,
    consumedSubscriptionPaymentId: null,
    subscriptionPaymentToDecrement: null,
  };
}
