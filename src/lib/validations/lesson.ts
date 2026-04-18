import { z } from "zod";

import { LessonKind } from "@/generated/prisma/enums";
import {
  CENTER_DAY_START_MINUTES,
  LAST_LESSON_START_HOUR,
} from "@/lib/schedule-config";
import { getSlotStartMinutesList } from "@/lib/time-minutes";

function emptyToUndefined(s: string | undefined) {
  const t = s?.trim();
  return t === "" || t === undefined ? undefined : t;
}

const ALLOWED_STARTS = new Set(getSlotStartMinutesList());

export const lessonFormSchema = z
  .object({
    lessonDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana noto‘g‘ri"),
    startMinutes: z.coerce.number().int(),
    teacherId: z.string().min(1, "O‘qituvchini tanlang"),
    studentId: z.string().min(1, "O‘quvchini tanlang"),
    notes: z.preprocess(emptyToUndefined, z.string().max(2000).optional()),
    kind: z
      .string()
      .optional()
      .transform((v) => (v === LessonKind.CONSULTATION ? LessonKind.CONSULTATION : LessonKind.LESSON)),
  })
  .superRefine((data, ctx) => {
    const { startMinutes } = data;
    if (!ALLOWED_STARTS.has(startMinutes)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Dars faqat soat boshida: ${CENTER_DAY_START_MINUTES / 60}:00–${LAST_LESSON_START_HOUR}:00`,
        path: ["startMinutes"],
      });
    }
  });

export type LessonFormValues = z.infer<typeof lessonFormSchema>;
