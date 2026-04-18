-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('DAILY', 'SUBSCRIPTION');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "kind" "PaymentKind" NOT NULL DEFAULT 'DAILY';
ALTER TABLE "Payment" ADD COLUMN "teacherId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "teacherShareSom" INTEGER;
ALTER TABLE "Payment" ADD COLUMN "subscriptionLessonCount" INTEGER;
ALTER TABLE "Payment" ADD COLUMN "teacherSharePerLessonSom" INTEGER;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Payment_teacherId_idx" ON "Payment"("teacherId");
