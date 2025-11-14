-- Alter enum to support new status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type typ
    JOIN pg_enum enum ON enum.enumtypid = typ.oid
    WHERE typ.typname = 'ScreeningStatus' AND enum.enumlabel = 'AGENDADA'
  ) THEN
    ALTER TYPE "ScreeningStatus" ADD VALUE 'AGENDADA';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type typ
    JOIN pg_enum enum ON enum.enumtypid = typ.oid
    WHERE typ.typname = 'ScreeningStatus' AND enum.enumlabel = 'CONCLUIDA'
  ) THEN
    ALTER TYPE "ScreeningStatus" ADD VALUE 'CONCLUIDA';
  END IF;
END $$;

-- Add updatedAt column defaulting to now for existing rows
ALTER TABLE "Screening"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();





