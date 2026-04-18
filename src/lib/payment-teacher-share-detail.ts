import type { Payment } from "@/generated/prisma/client";
import { PaymentKind } from "@/generated/prisma/enums";

import { formatSomUZS } from "@/lib/format-currency";

/** Kunlik yoki abonentlik bo‘yicha o‘qituvchi ulushining qisqa matni */
export function paymentTeacherShareDetail(
  p: Pick<
    Payment,
    | "kind"
    | "teacherShareSom"
    | "subscriptionLessonCount"
    | "teacherSharePerLessonSom"
    | "subscriptionLessonsRemaining"
  >,
): string {
  if (p.kind === PaymentKind.SUBSCRIPTION && p.subscriptionLessonCount && p.teacherSharePerLessonSom != null) {
    const rem =
      p.subscriptionLessonsRemaining != null ? ` · ${p.subscriptionLessonsRemaining} dars qoldi` : "";
    return `${p.subscriptionLessonCount} dars × ${formatSomUZS(p.teacherSharePerLessonSom)} so‘m${rem}`;
  }
  if (p.teacherShareSom != null) {
    return `${formatSomUZS(p.teacherShareSom)} so‘m`;
  }
  return "—";
}
