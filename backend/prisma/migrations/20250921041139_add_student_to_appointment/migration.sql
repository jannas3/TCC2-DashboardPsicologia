-- AlterTable
ALTER TABLE "public"."Appointment" ADD COLUMN     "studentId" TEXT;

-- CreateIndex
CREATE INDEX "Appointment_studentId_idx" ON "public"."Appointment"("studentId");

-- AddForeignKey
ALTER TABLE "public"."Appointment" ADD CONSTRAINT "Appointment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
