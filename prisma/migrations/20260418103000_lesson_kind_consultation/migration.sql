-- CreateEnum
CREATE TYPE "LessonKind" AS ENUM ('LESSON', 'CONSULTATION');

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN "offersConsultation" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "kind" "LessonKind" NOT NULL DEFAULT 'LESSON';

-- CreateIndex
CREATE INDEX "Lesson_lessonDate_kind_idx" ON "Lesson"("lessonDate", "kind");
