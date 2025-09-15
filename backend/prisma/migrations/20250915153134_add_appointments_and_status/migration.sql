-- CreateEnum
CREATE TYPE "public"."ScreeningStatus" AS ENUM ('NEW', 'REVIEWED', 'SCHEDULED', 'CONVERTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DONE', 'NO_SHOW', 'CANCELLED');

-- AlterTable
ALTER TABLE "public"."Screening" ADD COLUMN     "status" "public"."ScreeningStatus" NOT NULL DEFAULT 'NEW';

-- CreateTable
CREATE TABLE "public"."Appointment" (
    "id" TEXT NOT NULL,
    "screeningId" TEXT,
    "caseId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "channel" TEXT NOT NULL,
    "professional" TEXT NOT NULL,
    "status" "public"."AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_screeningId_key" ON "public"."Appointment"("screeningId");

-- CreateIndex
CREATE INDEX "Appointment_professional_startsAt_endsAt_idx" ON "public"."Appointment"("professional", "startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_screeningId_fkey" FOREIGN KEY ("screeningId") REFERENCES "public"."Screening"("id") ON DELETE SET NULL ON UPDATE CASCADE;
