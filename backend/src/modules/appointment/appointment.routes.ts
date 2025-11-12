import { Router, type Request, type Response } from "express";
import { prisma } from "../../db/prisma.js";

const router = Router();

type Status = "PENDING" | "CONFIRMED" | "DONE" | "NO_SHOW" | "CANCELLED";

// Janela de atendimento: 14h–18h
// topo do arquivo
const BUSINESS_START_HOUR = 14;
const BUSINESS_END_HOUR = 18;

// defina o timezone "oficial" do atendimento via env, com default
const BUSINESS_TZ = process.env.BUSINESS_TZ || "America/Manaus";

// util: extrai HH:mm *da perspectiva do timezone desejado*
function getHMInTZ(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).formatToParts(date);
  const hh = Number(parts.find(p => p.type === "hour")?.value ?? "0");
  const mm = Number(parts.find(p => p.type === "minute")?.value ?? "0");
  return { hh, mm };
}

function validateBusinessHours(start: Date, end: Date): string | null {
  if (isNaN(+start) || isNaN(+end)) return "Datas inválidas.";
  if (start >= end) return "Início deve ser antes do término.";

  // 👇 pega hora/minuto no timezone de negócio
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

// ---------- CREATE ----------
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      screeningId,
      studentId,
      startsAt,
      durationMin,
      professional,
      channel,
      note,
    } = (req.body ?? {}) as {
      screeningId?: string;
      studentId?: string;
      startsAt: string;
      durationMin: number;
      professional: string;
      channel: string;
      note?: string;
    };

    if (!startsAt || !durationMin || !professional || !channel) {
      return res
        .status(400)
        .send("Campos obrigatórios: startsAt, durationMin, professional, channel.");
    }

    // Se não veio studentId mas veio screeningId, tenta inferir
    let effectiveStudentId = studentId;
    if (!effectiveStudentId && screeningId) {
      const sc = await prisma.screening.findUnique({
        where: { id: screeningId },
        select: { studentId: true },
      });
      if (sc?.studentId) effectiveStudentId = sc.studentId;
    }

    const start = new Date(startsAt);
    const end = new Date(start.getTime() + Number(durationMin) * 60_000);

    // Valida janela 14–18h
    const hourErr = validateBusinessHours(start, end);
    if (hourErr) return res.status(422).send(hourErr);

    // Conflito
    const conflicts = await prisma.appointment.findMany({
      where: overlapWhere(start, end, professional),
      select: { id: true, startsAt: true, endsAt: true },
      take: 5,
      orderBy: { startsAt: "asc" },
    });
    if (conflicts.length) return res.status(409).json({ conflicts });

    const appt = await prisma.appointment.create({
      data: {
        screeningId: screeningId ?? null,
        studentId: effectiveStudentId ?? null,
        caseId: null,
        startsAt: start,
        endsAt: end,
        durationMin: Number(durationMin),
        professional,
        channel,
        status: "CONFIRMED",
        note: note ?? null,
      },
      include: { student: { select: { id: true, nome: true, matricula: true } } },
    });

    if (screeningId) {
      await prisma.screening.update({
        where: { id: screeningId },
        data: { status: "SCHEDULED" },
      });
    }

    return res.status(201).json(appt);
  } catch (e: any) {
    console.error(e);
    return res.status(500).send(e?.message ?? "Erro ao criar agendamento");
  }
});

// ---------- LIST ----------
router.get("/", async (req: Request, res: Response) => {
  try {
    const { from, to, status, professional, channel } = req.query as {
      from?: string;
      to?: string;
      status?: Status;
      professional?: string;
      channel?: string;
    };

    const where: any = {};
    if (from || to) {
      where.startsAt = {};
      if (from) where.startsAt.gte = new Date(from);
      if (to) where.startsAt.lte = new Date(to);
    }
    if (status) where.status = status;
    if (professional) where.professional = professional;
    if (channel) where.channel = channel;

    const items = await prisma.appointment.findMany({
      where,
      orderBy: { startsAt: "asc" },
      take: 500,
      include: { student: { select: { id: true, nome: true, matricula: true } } },
    });
    return res.json(items);
  } catch (e: any) {
    console.error(e);
    return res.status(500).send("Erro ao listar agendamentos");
  }
});

// ---------- UPDATE (PATCH GENÉRICO) ----------
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { status, startsAt, durationMin, professional, channel, note } = req.body as {
      status?: Status;
      startsAt?: string;
      durationMin?: number;
      professional?: string;
      channel?: string;
      note?: string | null;
    };

    const current = await prisma.appointment.findUnique({
      where: { id },
      include: { student: { select: { id: true, nome: true, matricula: true } } },
    });
    if (!current) return res.status(404).send("Agendamento não encontrado.");

    // Se alterar horário/prof, validar conflito e janela 14–18h
    let nextStarts = current.startsAt;
    let nextEnds = current.endsAt;
    let nextProfessional = current.professional;
    let nextDuration = current.durationMin;

    if (startsAt || durationMin || professional) {
      nextStarts = startsAt ? new Date(startsAt) : current.startsAt;
      nextDuration = durationMin ?? current.durationMin;
      nextEnds = new Date(nextStarts.getTime() + nextDuration * 60_000);
      nextProfessional = professional ?? current.professional;

      // Horário comercial
      const hourErr = validateBusinessHours(nextStarts, nextEnds);
      if (hourErr) return res.status(422).send(hourErr);

      // Conflito
      const conflicts = await prisma.appointment.findMany({
        where: {
          ...overlapWhere(nextStarts, nextEnds, nextProfessional),
          id: { not: id },
        },
        select: { id: true },
        take: 1,
      });
      if (conflicts.length) return res.status(409).send("Conflito de horário.");
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        startsAt: nextStarts,
        endsAt: nextEnds,
        durationMin: nextDuration,
        professional: nextProfessional,
        channel: channel ?? current.channel,
        note: note ?? current.note,
      },
      include: { student: { select: { id: true, nome: true, matricula: true } } },
    });

    return res.json(updated);
  } catch (e: any) {
    console.error(e);
    return res.status(500).send(e?.message ?? "Erro ao atualizar agendamento");
  }
});

// ---------- AÇÕES ----------
async function setStatus(id: string, status: Status) {
  return prisma.appointment.update({
    where: { id },
    data: { status },
    include: { student: { select: { id: true, nome: true, matricula: true } } },
  });
}
router.post("/:id/confirm", async (req: Request, res: Response) => {
  try { res.json(await setStatus(req.params.id, "CONFIRMED")); }
  catch (e: any) { console.error(e); res.status(500).send("Falha ao confirmar"); }
});
router.post("/:id/done", async (req: Request, res: Response) => {
  try { res.json(await setStatus(req.params.id, "DONE")); }
  catch (e: any) { console.error(e); res.status(500).send("Falha ao concluir"); }
});
router.post("/:id/no-show", async (req: Request, res: Response) => {
  try { res.json(await setStatus(req.params.id, "NO_SHOW")); }
  catch (e: any) { console.error(e); res.status(500).send("Falha ao marcar falta"); }
});
router.post("/:id/cancel", async (req: Request, res: Response) => {
  try { res.json(await setStatus(req.params.id, "CANCELLED")); }
  catch (e: any) { console.error(e); res.status(500).send("Falha ao cancelar"); }
});

// ---------- SESSION NOTES ----------
router.get("/:id/note", async (req: Request, res: Response) => {
  try {
    const note = await prisma.sessionNote.findUnique({
      where: { appointmentId: req.params.id },
    });
    // pode retornar null (frontend já trata)
    return res.json(note);
  } catch (e: any) {
    console.error(e);
    return res.status(500).send("Falha ao buscar nota");
  }
});

router.put("/:id/note", async (req: Request, res: Response) => {
  try {
    const appointmentId = req.params.id;
    const {
      studentId,
      before,
      complaint,
      summary,
      observation,
      evolution,
      sharedField,
      fixedNote,
    } = (req.body ?? {}) as {
      studentId?: string;
      before?: string | null;
      complaint?: string | null;
      summary?: string | null;
      observation?: string | null;
      evolution?: string | null;
      sharedField?: string | null;
      fixedNote?: string | null;
    };

    if (!studentId) return res.status(400).send("studentId é obrigatório.");

    const saved = await prisma.sessionNote.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        studentId,
        before,
        complaint,
        summary,
        observation,
        evolution,
        sharedField,
        fixedNote,
      },
      update: {
        studentId,
        before,
        complaint,
        summary,
        observation,
        evolution,
        sharedField,
        fixedNote,
      },
    });

    return res.json(saved);
  } catch (e: any) {
    console.error(e);
    return res.status(500).send("Falha ao salvar nota");
  }
});

// DELETE /api/appointments/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await prisma.appointment.delete({ where: { id } });
    // se houver SessionNote, o onDelete: Cascade no schema cuida da remoção
    return res.status(204).end();
  } catch (e: any) {
    // registro não encontrado
    if (e?.code === "P2025") return res.status(404).send("Agendamento não encontrado.");
    console.error(e);
    return res.status(500).send("Falha ao excluir agendamento.");
  }
});


export default router;
