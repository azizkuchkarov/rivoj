-- Ensure StudentGroup enum exists for environments built from old migrations.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'StudentGroup') THEN
    CREATE TYPE "StudentGroup" AS ENUM ('LOGOPED', 'ABA');
  END IF;
END $$;

-- Ensure Student.group column exists for environments where it was introduced outside migrations.
ALTER TABLE "Student"
ADD COLUMN IF NOT EXISTS "group" "StudentGroup" NOT NULL DEFAULT 'LOGOPED';

-- Add newly supported group values.
ALTER TYPE "StudentGroup" ADD VALUE IF NOT EXISTS 'SENSORY_INTEGRATION';
ALTER TYPE "StudentGroup" ADD VALUE IF NOT EXISTS 'SENSORIMOTOR';
