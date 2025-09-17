-- CreateTable
CREATE TABLE "public"."SessionNote" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "before" TEXT,
    "complaint" TEXT,
    "summary" TEXT,
    "observation" TEXT,
    "evolution" TEXT,
    "sharedField" TEXT,
    "fixedNote" TEXT,

    CONSTRAINT "SessionNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionNote_appointmentId_key" ON "public"."SessionNote"("appointmentId");

-- AddForeignKey
ALTER TABLE "public"."SessionNote" ADD CONSTRAINT "SessionNote_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "public"."Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
