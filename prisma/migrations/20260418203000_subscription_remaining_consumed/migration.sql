-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "subscriptionLessonsRemaining" INTEGER;

UPDATE "Payment"
SET "subscriptionLessonsRemaining" = "subscriptionLessonCount"
WHERE "kind" = 'SUBSCRIPTION' AND "subscriptionLessonCount" IS NOT NULL;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "consumedSubscriptionPaymentId" TEXT;

-- CreateIndex
CREATE INDEX "Lesson_consumedSubscriptionPaymentId_idx" ON "Lesson"("consumedSubscriptionPaymentId");

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_consumedSubscriptionPaymentId_fkey" FOREIGN KEY ("consumedSubscriptionPaymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
