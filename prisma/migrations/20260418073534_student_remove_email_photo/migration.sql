/*
  Warnings:

  - You are about to drop the column `guardianEmail` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `photoUrl` on the `Student` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Student" DROP COLUMN "guardianEmail",
DROP COLUMN "photoUrl";
