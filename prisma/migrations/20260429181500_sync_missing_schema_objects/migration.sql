-- Backfill objects that existed in schema but were missing from historical migrations.

-- Student.telegramChatId (nullable, no unique constraint in current schema)
ALTER TABLE "Student"
ADD COLUMN IF NOT EXISTS "telegramChatId" TEXT;

-- SystemProfile role enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SystemProfileRole') THEN
    CREATE TYPE "SystemProfileRole" AS ENUM ('MANAGER', 'ADMIN');
  END IF;
END $$;

-- OperationalExpense table
CREATE TABLE IF NOT EXISTS "OperationalExpense" (
  "id" TEXT NOT NULL,
  "amountSom" INTEGER NOT NULL,
  "spentAt" DATE NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OperationalExpense_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OperationalExpense_spentAt_idx" ON "OperationalExpense"("spentAt");

-- SystemProfile table
CREATE TABLE IF NOT EXISTS "SystemProfile" (
  "id" TEXT NOT NULL,
  "role" "SystemProfileRole" NOT NULL,
  "fullName" TEXT NOT NULL,
  "telegramChatId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SystemProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SystemProfile_role_key" ON "SystemProfile"("role");
