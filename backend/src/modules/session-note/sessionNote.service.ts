import { prisma } from "../../db/prisma.js";

export interface SessionNoteData {
  studentId: string;
  before?: string | null;
  complaint?: string | null;
  summary?: string | null;
  observation?: string | null;
  evolution?: string | null;
  sharedField?: string | null;
  fixedNote?: string | null;
}

export const sessionNoteService = {
  async getByAppointmentId(appointmentId: string) {
    return prisma.sessionNote.findUnique({
      where: { appointmentId },
    });
  },

  async upsert(appointmentId: string, data: SessionNoteData) {
    // Verifica se o agendamento existe
    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { studentId: true },
    });

    if (!appt) {
      throw new Error("Agendamento não encontrado.");
    }

    // Se não veio studentId, tenta inferir do agendamento
    const effectiveStudentId = data.studentId || appt.studentId;
    if (!effectiveStudentId) {
      throw new Error("studentId é obrigatório para salvar nota.");
    }

    return prisma.sessionNote.upsert({
      where: { appointmentId },
      update: {
        studentId: effectiveStudentId,
        before: data.before ?? null,
        complaint: data.complaint ?? null,
        summary: data.summary ?? null,
        observation: data.observation ?? null,
        evolution: data.evolution ?? null,
        sharedField: data.sharedField ?? null,
        fixedNote: data.fixedNote ?? null,
      },
      create: {
        appointmentId,
        studentId: effectiveStudentId,
        before: data.before ?? null,
        complaint: data.complaint ?? null,
        summary: data.summary ?? null,
        observation: data.observation ?? null,
        evolution: data.evolution ?? null,
        sharedField: data.sharedField ?? null,
        fixedNote: data.fixedNote ?? null,
      },
    });
  },
};


