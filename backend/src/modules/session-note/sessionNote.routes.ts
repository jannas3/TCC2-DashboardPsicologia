import { Router } from "express";
import { prisma } from "../../db/prisma.js";

const router = Router();

// GET /api/appointments/:id/note
router.get("/appointments/:id/note", async (req, res) => {
  try {
    const appointmentId = req.params.id;

    const note = await prisma.sessionNote.findUnique({
      where: { appointmentId },
    });

    // Se não tem, devolve null (frontend já trata criando rascunho)
    return res.json(note ?? null);
  } catch (e: any) {
    console.error(e);
    return res.status(500).send(e?.message ?? "Erro ao obter nota da sessão");
  }
});

// PUT /api/appointments/:id/note
router.put("/appointments/:id/note", async (req, res) => {
  try {
    const appointmentId = req.params.id;

    // garanta que o agendamento existe
    const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appt) return res.status(404).send("Agendamento não encontrado.");

    // No seu frontend você envia { studentId, ...campos }
    const {
      studentId,
      before, complaint, summary, observation, evolution, sharedField, fixedNote,
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

    if (!studentId) {
      // tenta inferir do próprio agendamento (se você salvou studentId lá)
      const sid = (appt as any).studentId as string | undefined;
      if (!sid) return res.status(400).send("studentId é obrigatório para salvar nota.");
    }

    const data = {
      appointmentId,
      studentId: studentId ?? ((appt as any).studentId as string),
      before: before ?? null,
      complaint: complaint ?? null,
      summary: summary ?? null,
      observation: observation ?? null,
      evolution: evolution ?? null,
      sharedField: sharedField ?? null,
      fixedNote: fixedNote ?? null,
    };

    // upsert pela unique (appointmentId)
    const saved = await prisma.sessionNote.upsert({
      where: { appointmentId },
      update: data,
      create: data,
    });

    return res.json(saved);
  } catch (e: any) {
    console.error(e);
    return res.status(500).send(e?.message ?? "Erro ao salvar nota da sessão");
  }
});

export default router;
