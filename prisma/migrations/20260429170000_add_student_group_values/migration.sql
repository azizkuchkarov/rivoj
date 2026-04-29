-- Add new values to StudentGroup enum for expanded student categorization.
ALTER TYPE "StudentGroup" ADD VALUE IF NOT EXISTS 'SENSORY_INTEGRATION';
ALTER TYPE "StudentGroup" ADD VALUE IF NOT EXISTS 'SENSORIMOTOR';
