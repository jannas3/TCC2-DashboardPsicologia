import { Router } from "express";
import { prisma } from "../../db/prisma.js";

const router = Router();

type Status = "PENDING" | "CONFIRMED" | "DONE" | "NO_SHOW" | "CANCELLED";

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
router.post("/", async (req, res) => {
  try {
    const { screeningId, studentId, startsAt, durationMin, professional, channel, note } =
      (req.body ?? {}) as {
        screeningId?: string;
        studentId?: string;
        startsAt: string;
        durationMin: number;
        professional: string;
        channel: string;
        note?: string;
      };

    if (!startsAt || !durationMin || !professional || !channel) {
      return res.status(400).send("Campos obrigatórios: startsAt, durationMin, professional, channel.");
    }

    // se não veio studentId mas veio screeningId, tenta inferir
    let _studentId = studentId;
    if (!_studentId && screeningId) {
      const sc = await prisma.screening.findUnique({
        where: { id: screeningId },
        select: { studentId: true },
      });
      if (sc?.studentId) _studentId = sc.studentId;
    }

    const start = new Date(startsAt);
    const end = new Date(start.getTime() + Number(durationMin) * 60_000);

    // conflito
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
        caseId: null,
        startsAt: start,
        endsAt: end,
        durationMin: Number(durationMin),
        professional,
        channel,
        status: "PENDING",
        note: note ?? null,
      },
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
router.get("/", async (req, res) => {
  try {
    const { from, to, status, professional, channel } = req.query as {
      from?: string; to?: string; status?: Status; professional?: string; channel?: string;
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
    });
    return res.json(items);
  } catch (e: any) {
    console.error(e);
    return res.status(500).send("Erro ao listar agendamentos");
  }
});

// ---------- UPDATE (PATCH GENÉRICO) ----------
router.patch("/:id", async (req, res) => {
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

    const current = await prisma.appointment.findUnique({ where: { id } });
    if (!current) return res.status(404).send("Agendamento não encontrado.");

    // se alterar horário/profissional, validar conflito
    let nextStarts = current.startsAt;
    let nextEnds = current.endsAt;
    let nextProfessional = current.professional;

    if (startsAt || durationMin || professional) {
      nextStarts = startsAt ? new Date(startsAt) : current.startsAt;
      const dur = durationMin ?? current.durationMin;
      nextEnds = new Date(nextStarts.getTime() + dur * 60_000);
      nextProfessional = professional ?? current.professional;

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
        durationMin: durationMin ?? current.durationMin,
        professional: nextProfessional,
        channel: channel ?? current.channel,
        note: note ?? current.note,
      },
    });

    return res.json(updated);
  } catch (e: any) {
    console.error(e);
    return res.status(500).send(e?.message ?? "Erro ao atualizar agendamento");
  }
});

// ---------- AÇÕES (para o frontend que usa POST /:id/...) ----------
async function setStatus(id: string, status: Status) {
  return prisma.appointment.update({ where: { id }, data: { status } });
}
router.post("/:id/confirm", async (req, res) => {
  try {
    const r = await setStatus(req.params.id, "CONFIRMED");
    res.json(r);
  } catch (e: any) { console.error(e); res.status(500).send("Falha ao confirmar"); }
});
router.post("/:id/done", async (req, res) => {
  try {
    const r = await setStatus(req.params.id, "DONE");
    res.json(r);
  } catch (e: any) { console.error(e); res.status(500).send("Falha ao concluir"); }
});
router.post("/:id/no-show", async (req, res) => {
  try {
    const r = await setStatus(req.params.id, "NO_SHOW");
    res.json(r);
  } catch (e: any) { console.error(e); res.status(500).send("Falha ao marcar falta"); }
});
router.post("/:id/cancel", async (req, res) => {
  try {
    const r = await setStatus(req.params.id, "CANCELLED");
    res.json(r);
  } catch (e: any) { console.error(e); res.status(500).send("Falha ao cancelar"); }
});

export default router;
