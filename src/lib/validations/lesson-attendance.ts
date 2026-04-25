import { z } from "zod";

import { LessonAttendance, LessonGuardianFee } from "@/generated/prisma/enums";

export const markLessonAttendanceSchema = z
  .object({
    lessonId: z.string().min(1),
    attendance: z.nativeEnum(LessonAttendance),
    guardianFee: z.nativeEnum(LessonGuardianFee).optional(),
  });

export type MarkLessonAttendanceInput = z.infer<typeof markLessonAttendanceSchema>;
