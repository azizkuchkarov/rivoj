import { z } from "zod";

import { PaymentKind, PaymentMethod } from "@/generated/prisma/enums";

function emptyToUndefined(s: string | undefined) {
  const t = s?.trim();
  return t === "" || t === undefined ? undefined : t;
}

function numFromForm(v: unknown): number | undefined {
  if (v === "" || v === undefined || v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

export const paymentFormSchema = z
  .object({
    studentId: z.string().min(1, "O‘quvchini tanlang"),
    teacherId: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    kind: z.nativeEnum(PaymentKind),
    amountSom: z.coerce.number().int().min(1000, "Summa kamida 1000 so‘m").max(999_999_999, "Summa juda katta"),
    paidAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana noto‘g‘ri"),
    method: z.nativeEnum(PaymentMethod),
    description: z.preprocess(emptyToUndefined, z.string().max(500).optional()),
    notes: z.preprocess(emptyToUndefined, z.string().max(2000).optional()),
    teacherShareSom: z.preprocess(numFromForm, z.number().int().optional()),
    subscriptionLessonCount: z.preprocess(numFromForm, z.number().int().optional()),
    teacherSharePerLessonSom: z.preprocess(numFromForm, z.number().int().optional()),
    redirectAfter: z.preprocess(
      (v) => (v === "student" ? "student" : "payments"),
      z.enum(["payments", "student"]),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.kind === PaymentKind.DAILY) {
      if (!data.teacherId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "O‘qituvchini tanlang",
          path: ["teacherId"],
        });
      }
      if (data.teacherShareSom === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "O‘qituvchi ulushini kiriting",
          path: ["teacherShareSom"],
        });
        return;
      }
      if (data.teacherShareSom < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Manfiy bo‘lmasin",
          path: ["teacherShareSom"],
        });
      }
      if (data.teacherShareSom > data.amountSom) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "O‘qituvchi ulushi jami to‘lovdan oshmasin",
          path: ["teacherShareSom"],
        });
      }
    }
    if (data.kind === PaymentKind.SUBSCRIPTION) {
      if (data.subscriptionLessonCount === undefined || data.subscriptionLessonCount < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Darslar soni kamida 1",
          path: ["subscriptionLessonCount"],
        });
      }
      if (data.teacherSharePerLessonSom === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Har bir dars uchun o‘qituvchi ulushini kiriting",
          path: ["teacherSharePerLessonSom"],
        });
        return;
      }
      if (data.teacherSharePerLessonSom < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Manfiy bo‘lmasin",
          path: ["teacherSharePerLessonSom"],
        });
      }
    }
  });

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
