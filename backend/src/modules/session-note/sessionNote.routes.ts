import { Router } from "express";
import { prisma } from "../../db/prisma.js";

const router = Router();

// GET /api/appointments/:id/note  -> retorna nota (ou null)
router.get("/appointments/:id/note", async (req, res) => {
  try {
    const id = req.params.id;
    const note = await prisma.sessionNote.findUnique({ where: { appointmentId: id } });
    return res.json(note ?? null);
  } catch (e: any) {
    console.error(e);
    return res.status(500).send("Erro ao buscar nota");
  }
});

// PUT /api/appointments/:id/note  -> upsert nota
router.put("/appointments/:id/note", async (req, res) => {
  try {
    const id = req.params.id;
    const { studentId, ...fields } = (req.body ?? {}) as any;

    if (!studentId) return res.status(400).send("studentId é obrigatório.");

    const up = await prisma.sessionNote.upsert({
      where: { appointmentId: id },
      update: { ...fields },
      create: { appointmentId: id, studentId, ...fields },
    });
    return res.json(up);
  } catch (e: any) {
    console.error(e);
    return res.status(500).send(e?.message ?? "Erro ao salvar nota");
  }
});

export default router;
