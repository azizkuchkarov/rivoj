import { z } from "zod";

import {
  CENTER_DAY_START_MINUTES,
  LAST_LESSON_START_HOUR,
} from "@/lib/schedule-config";
import { STUDENT_GROUP_VALUES } from "@/lib/student-group";
import { getSlotStartMinutesList } from "@/lib/time-minutes";

const ALLOWED_STARTS = new Set(getSlotStartMinutesList());

function emptyToUndefined(s: string | undefined) {
  const t = s?.trim();
  return t === "" || t === undefined ? undefined : t;
}

function numFromForm(v: unknown): number | undefined {
  if (v === "" || v === undefined || v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

/** Konsultatsiyaga qabul — har doim yangi o‘quvchi kartochkasi */
export const consultationIntakeSchema = z
  .object({
    fullName: z.string().trim().min(2, "Ism kamida 2 belgi bo‘lishi kerak").max(120),
    group: z.enum(STUDENT_GROUP_VALUES, { message: "Guruhni tanlang" }),
    guardianName: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
    guardianPhone: z.preprocess(emptyToUndefined, z.string().trim().max(32).optional()),
    teacherId: z.string().min(1, "O‘qituvchini tanlang"),
    lessonDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana noto‘g‘ri"),
    startMinutes: z
      .string()
      .min(1, "Bo‘sh vaqtni tanlang")
      .transform((s) => Number.parseInt(s, 10))
      .refine((n) => !Number.isNaN(n) && Number.isInteger(n), "Vaqt sloti noto‘g‘ri"),
    consultationAmountSom: z.preprocess(
      numFromForm,
      z.number().int().min(1000, "Konsultatsiya summasi kamida 1000 so‘m").max(999_999_999, "Summa juda katta"),
    ),
    notes: z.preprocess(emptyToUndefined, z.string().max(2000).optional()),
  })
  .superRefine((data, ctx) => {
    if (!ALLOWED_STARTS.has(data.startMinutes)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Vaqt faqat soat boshida: ${CENTER_DAY_START_MINUTES / 60}:00–${LAST_LESSON_START_HOUR}:00`,
        path: ["startMinutes"],
      });
    }
  });

export type ConsultationIntakeValues = z.infer<typeof consultationIntakeSchema>;
