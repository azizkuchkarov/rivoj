import type { Lesson, Student, Teacher } from "@/generated/prisma/client";

export type LessonWithRelations = Lesson & {
  teacher: Pick<Teacher, "id" | "fullName" | "listNumber">;
  student: Pick<Student, "id" | "fullName">;
};
