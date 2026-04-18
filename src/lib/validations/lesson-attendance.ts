import { z } from "zod";

import { LessonAttendance, LessonGuardianFee } from "@/generated/prisma/enums";

export const markLessonAttendanceSchema = z
  .object({
    lessonId: z.string().min(1),
    attendance: z.nativeEnum(LessonAttendance),
    guardianFee: z.nativeEnum(LessonGuardianFee).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.attendance === LessonAttendance.ABSENT) {
      return;
    }
    if (data.attendance === LessonAttendance.PRESENT) {
      if (
        data.guardianFee !== LessonGuardianFee.PAID &&
        data.guardianFee !== LessonGuardianFee.UNPAID
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "To‘lov holatini tanlang",
          path: ["guardianFee"],
        });
      }
    }
  });

export type MarkLessonAttendanceInput = z.infer<typeof markLessonAttendanceSchema>;
