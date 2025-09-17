import { Router } from "express";
import { postScreening } from "./screening.controller.js";
import { botAuth } from "../../middlewares/botAuth.js";
import { prisma } from "../../db/prisma.js";

const router = Router();

// GET para visualizar no navegador
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 50), 500);
    const items = await prisma.screening.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: {
            id: true,
            nome: true,
            matricula: true,
            curso: true,
            periodo: true,
            telegramId: true,
          },
        },
      },
    });
    return res.json(items);
  } catch (e: any) {
    console.error(e);
    return res.status(500).send("Erro ao listar triagens");
  }
});

// POST protegido (usado pelo bot)
router.post("/", botAuth, postScreening);

// PATCH /api/screenings/:id/status  { status }
router.patch("/:id/status", async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body as {
      status: "NEW" | "REVIEWED" | "SCHEDULED" | "CONVERTED" | "ARCHIVED";
    };
    if (!status) return res.status(400).send("status é obrigatório");

    const updated = await prisma.screening.update({
      where: { id },
      data: { status },
    });
    return res.json(updated);
  } catch (e: any) {
    console.error(e);
    return res.status(500).send(e?.message ?? "Erro ao atualizar status");
  }
});


export default router;
