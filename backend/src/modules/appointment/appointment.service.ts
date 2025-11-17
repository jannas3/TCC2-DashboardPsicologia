import { prisma } from "../../db/prisma.js";

type Status = "PENDING" | "CONFIRMED" | "DONE" | "NO_SHOW" | "CANCELLED";

// Janela de atendimento: 14h–18h
const BUSINESS_START_HOUR = 14;
const BUSINESS_END_HOUR = 18;
const BUSINESS_TZ = process.env.BUSINESS_TZ || "America/Manaus";

// util: extrai HH:mm *da perspectiva do timezone desejado*
function getHMInTZ(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).formatToParts(date);
  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return { hh, mm };
}

function validateBusinessHours(start: Date, end: Date): string | null {
  if (isNaN(+start) || isNaN(+end)) return "Datas inválidas.";
  if (start >= end) return "Início deve ser antes do término.";

  const { hh: sh, mm: sm } = getHMInTZ(start, BUSINESS_TZ);
  const { hh: eh, mm: em } = getHMInTZ(end, BUSINESS_TZ);

  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  const min = BUSINESS_START_HOUR * 60;
  const max = BUSINESS_END_HOUR * 60; // exclusivo

  if (startMinutes < min || endMinutes > max) {
    return `Atendimentos somente entre ${String(BUSINESS_START_HOUR).padStart(2, "0")}:00 e ${String(BUSINESS_END_HOUR).padStart(2, "0")}:00 (${BUSINESS_TZ}).`;
  }
  return null;
}

// checagem de sobreposição de horários
function overlapWhere(start: Date, end: Date, professional: string) {
  return {
    professional,
    status: { in: ["PENDING", "CONFIRMED", "DONE"] as Status[] },
    startsAt: { lt: end },
    endsAt: { gt: start },
  };
}

export interface AppointmentCreateData {
  screeningId?: string;
  studentId?: string;
  startsAt: string;
  durationMin: number;
  professional: string;
  channel: string;
  note?: string;
}

export interface AppointmentListParams {
  from?: string;
  to?: string;
  status?: Status;
  professional?: string;
  channel?: string;
}

export interface AppointmentUpdateData {
  status?: Status;
  startsAt?: string;
  durationMin?: number;
  professional?: string;
  channel?: string;
  note?: string | null;
}

export const appointmentService = {
  async create(data: AppointmentCreateData) {
    // Se não veio studentId mas veio screeningId, tenta inferir
    let effectiveStudentId = data.studentId;
    if (!effectiveStudentId && data.screeningId) {
      const sc = await prisma.screening.findUnique({
        where: { id: data.screeningId },
        select: { studentId: true },
      });
      if (sc?.studentId) effectiveStudentId = sc.studentId;
    }

    const start = new Date(data.startsAt);
    const end = new Date(start.getTime() + Number(data.durationMin) * 60_000);

    // Valida janela 14–18h
    const hourErr = validateBusinessHours(start, end);
    if (hourErr) throw new Error(hourErr);

    // Conflito
    const conflicts = await prisma.appointment.findMany({
      where: overlapWhere(start, end, data.professional),
      select: { id: true, startsAt: true, endsAt: true },
      take: 5,
      orderBy: { startsAt: "asc" },
    });
    if (conflicts.length) {
      const error: any = new Error("Conflito de horário");
      error.conflicts = conflicts;
      throw error;
    }

    const appt = await prisma.appointment.create({
      data: {
        screeningId: data.screeningId ?? null,
        studentId: effectiveStudentId ?? null,
        caseId: null,
        startsAt: start,
        endsAt: end,
        durationMin: Number(data.durationMin),
        professional: data.professional,
        channel: data.channel,
        status: "CONFIRMED",
        note: data.note ?? null,
      },
      include: { student: { select: { id: true, nome: true, matricula: true } } },
    });

    if (data.screeningId) {
      await prisma.screening.update({
        where: { id: data.screeningId },
        data: { status: "CONCLUIDA" },
      });
    }

    return appt;
  },

  async list(params: AppointmentListParams) {
    const where: any = {};
    if (params.from || params.to) {
      where.startsAt = {};
      if (params.from) where.startsAt.gte = new Date(params.from);
      if (params.to) where.startsAt.lte = new Date(params.to);
    }
    if (params.status) where.status = params.status;
    if (params.professional) where.professional = params.professional;
    if (params.channel) where.channel = params.channel;

    return prisma.appointment.findMany({
      where,
      orderBy: { startsAt: "asc" },
      take: 500,
      include: { student: { select: { id: true, nome: true, matricula: true } } },
    });
  },

  async update(id: string, data: AppointmentUpdateData) {
    const current = await prisma.appointment.findUnique({
      where: { id },
      include: { student: { select: { id: true, nome: true, matricula: true } } },
    });
    if (!current) throw new Error("Agendamento não encontrado.");

    // Se alterar horário/prof, validar conflito e janela 14–18h
    let nextStarts = current.startsAt;
    let nextEnds = current.endsAt;
    let nextProfessional = current.professional;
    let nextDuration = current.durationMin;

    if (data.startsAt || data.durationMin || data.professional) {
      nextStarts = data.startsAt ? new Date(data.startsAt) : current.startsAt;
      nextDuration = data.durationMin ?? current.durationMin;
      nextEnds = new Date(nextStarts.getTime() + nextDuration * 60_000);
      nextProfessional = data.professional ?? current.professional;

      // Horário comercial
      const hourErr = validateBusinessHours(nextStarts, nextEnds);
      if (hourErr) throw new Error(hourErr);

      // Conflito
      const conflicts = await prisma.appointment.findMany({
        where: {
          ...overlapWhere(nextStarts, nextEnds, nextProfessional),
          id: { not: id },
        },
        select: { id: true },
        take: 1,
      });
      if (conflicts.length) throw new Error("Conflito de horário.");
    }

    return prisma.appointment.update({
      where: { id },
      data: {
        status: data.status,
        startsAt: nextStarts,
        endsAt: nextEnds,
        durationMin: nextDuration,
        professional: nextProfessional,
        channel: data.channel ?? current.channel,
        note: data.note ?? current.note,
      },
      include: { student: { select: { id: true, nome: true, matricula: true } } },
    });
  },

  async setStatus(id: string, status: Status) {
    return prisma.appointment.update({
      where: { id },
      data: { status },
      include: { student: { select: { id: true, nome: true, matricula: true } } },
    });
  },

  async delete(id: string) {
    return prisma.appointment.delete({ where: { id } });
  },

  async findById(id: string) {
    return prisma.appointment.findUnique({
      where: { id },
      include: { student: { select: { id: true, nome: true, matricula: true } } },
    });
  },
};

