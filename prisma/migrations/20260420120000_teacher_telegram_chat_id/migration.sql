ALTER TABLE "Teacher"
ADD COLUMN "telegramChatId" TEXT;

CREATE UNIQUE INDEX "Teacher_telegramChatId_key" ON "Teacher"("telegramChatId");
