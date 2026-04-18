-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "listNumber" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Teacher_listNumber_idx" ON "Teacher"("listNumber");
