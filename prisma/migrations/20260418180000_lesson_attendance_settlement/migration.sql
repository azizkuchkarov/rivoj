-- CreateEnum
CREATE TYPE "LessonAttendance" AS ENUM ('UNMARKED', 'ABSENT', 'PRESENT');
CREATE TYPE "LessonGuardianFee" AS ENUM ('NA', 'PAID', 'UNPAID');
CREATE TYPE "TeacherEarningPayer" AS ENUM ('GUARDIAN', 'CENTER');

-- AlterTable Payment
ALTER TABLE "Payment" ADD COLUMN "lessonId" TEXT;
CREATE UNIQUE INDEX "Payment_lessonId_key" ON "Payment"("lessonId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable Lesson
ALTER TABLE "Lesson" ADD COLUMN "attendance" "LessonAttendance" NOT NULL DEFAULT 'UNMARKED';
ALTER TABLE "Lesson" ADD COLUMN "guardianFee" "LessonGuardianFee" NOT NULL DEFAULT 'NA';
ALTER TABLE "Lesson" ADD COLUMN "settlementSom" INTEGER;
ALTER TABLE "Lesson" ADD COLUMN "attendanceMarkedAt" TIMESTAMP(3);

-- CreateTable StudentDebt
CREATE TABLE "StudentDebt" (
    "id" TEXT NOT NULL,
    "amountSom" INTEGER NOT NULL,
    "note" TEXT,
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentDebt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentDebt_lessonId_key" ON "StudentDebt"("lessonId");
CREATE INDEX "StudentDebt_studentId_idx" ON "StudentDebt"("studentId");

ALTER TABLE "StudentDebt" ADD CONSTRAINT "StudentDebt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentDebt" ADD CONSTRAINT "StudentDebt_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable TeacherLessonEarning
CREATE TABLE "TeacherLessonEarning" (
    "id" TEXT NOT NULL,
    "amountSom" INTEGER NOT NULL,
    "payer" "TeacherEarningPayer" NOT NULL,
    "lessonId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherLessonEarning_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeacherLessonEarning_lessonId_key" ON "TeacherLessonEarning"("lessonId");
CREATE INDEX "TeacherLessonEarning_teacherId_idx" ON "TeacherLessonEarning"("teacherId");

ALTER TABLE "TeacherLessonEarning" ADD CONSTRAINT "TeacherLessonEarning_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherLessonEarning" ADD CONSTRAINT "TeacherLessonEarning_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
