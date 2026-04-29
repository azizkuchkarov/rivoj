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

function percentFromForm(v: unknown): number | undefined {
  if (v === "" || v === undefined || v === null) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.round(n * 100) / 100;
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
    teacherSharePercent: z.preprocess(percentFromForm, z.number().optional()),
    subscriptionLessonCount: z.preprocess(numFromForm, z.number().int().optional()),
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
      if (data.teacherSharePercent === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "O‘qituvchi ulushi foizini kiriting",
          path: ["teacherSharePercent"],
        });
        return;
      }
      if (data.teacherSharePercent < 0 || data.teacherSharePercent > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Foiz 0 dan 100 gacha bo‘lsin",
          path: ["teacherSharePercent"],
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
      if (data.teacherSharePercent === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "O‘qituvchi ulushi foizini kiriting",
          path: ["teacherSharePercent"],
        });
        return;
      }
      if (data.teacherSharePercent < 0 || data.teacherSharePercent > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Foiz 0 dan 100 gacha bo‘lsin",
          path: ["teacherSharePercent"],
        });
      }
    }
  });

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
