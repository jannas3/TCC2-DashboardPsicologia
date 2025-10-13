-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('MINIMO', 'LEVE', 'MODERADO', 'MODERADAMENTE_GRAVE', 'GRAVE');

-- CreateEnum
CREATE TYPE "ScreeningStatus" AS ENUM ('NEW', 'REVIEWED', 'SCHEDULED', 'CONVERTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DONE', 'NO_SHOW', 'CANCELLED');

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT,
    "nome" TEXT NOT NULL,
    "idade" INTEGER NOT NULL,
    "matricula" TEXT NOT NULL,
    "curso" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PROFESSIONAL',
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Screening" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "phq9Respostas" INTEGER[],
    "phq9Score" INTEGER NOT NULL,
    "gad7Respostas" INTEGER[],
    "gad7Score" INTEGER NOT NULL,
    "disponibilidade" TEXT NOT NULL,
    "observacao" TEXT,
    "relatorio" TEXT NOT NULL,
    "riskPHQ9" "RiskLevel" NOT NULL,
    "riskGAD7" "RiskLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ScreeningStatus" NOT NULL DEFAULT 'NEW',

    CONSTRAINT "Screening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "screeningId" TEXT,
    "studentId" TEXT,
    "caseId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "channel" TEXT NOT NULL,
    "professional" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionNote" (
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
CREATE UNIQUE INDEX "Student_matricula_key" ON "Student"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_screeningId_key" ON "Appointment"("screeningId");

-- CreateIndex
CREATE INDEX "Appointment_professional_startsAt_endsAt_idx" ON "Appointment"("professional", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Appointment_studentId_idx" ON "Appointment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionNote_appointmentId_key" ON "SessionNote"("appointmentId");

-- AddForeignKey
ALTER TABLE "Screening" ADD CONSTRAINT "Screening_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_screeningId_fkey" FOREIGN KEY ("screeningId") REFERENCES "Screening"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionNote" ADD CONSTRAINT "SessionNote_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
