/*
  Warnings:

  - You are about to drop the column `bio` on the `Teacher` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Lesson_consumedSubscriptionPaymentId_idx";

-- AlterTable
ALTER TABLE "Teacher" DROP COLUMN "bio";
