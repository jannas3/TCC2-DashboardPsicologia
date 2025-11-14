import { Router } from "express";
import { deleteScreening, postScreening } from "./screening.controller.js";
import { botAuth } from "../../middlewares/botAuth.js";
import { prisma } from "../../db/prisma.js";
import { requireAuth } from "../../middlewares/require-auth.js";

const router = Router();

// GET para visualizar no navegador
function normalizeStatus(value?: string | null): string | undefined {
  if (!value) return undefined;
  const cleaned = value
    .toString()
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  if (!cleaned) return undefined;
  return cleaned;
}

router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 50), 500);
    const statusRaw = req.query.status as string | undefined;
    const statusNotKey = (req.query["status!"] as string | undefined) ?? (req.query.statusNot as string | undefined);
    const statusNotRaw =
      statusNotKey ??
      (statusRaw && statusRaw.includes("!=") ? statusRaw.split("!=")[1] : undefined);
    const statusEqRaw =
      statusRaw && statusRaw.includes("!=") ? undefined : (statusRaw as string | undefined);

    const statusEq = normalizeStatus(statusEqRaw);
    const statusNot = normalizeStatus(statusNotRaw);

    const where: any = {};
    if (statusEq) {
      where.status = statusEq;
    } else if (statusNot) {
      where.status = { not: statusNot };
    }

    const items = await prisma.screening.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      where,
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
      status:
        | "NEW"
        | "REVIEWED"
        | "SCHEDULED"
        | "CONVERTED"
        | "ARCHIVED"
        | "AGENDADA"
        | "CONCLUIDA"
        | string;
    };
    if (!status) return res.status(400).send("status é obrigatório");

    const normalized = normalizeStatus(status);
    if (!normalized) return res.status(400).send("status inválido");

    const updated = await prisma.screening.update({
      where: { id },
      data: { status: normalized as any },
    });
    return res.json(updated);
  } catch (e: any) {
    console.error(e);
    return res.status(500).send(e?.message ?? "Erro ao atualizar status");
  }
});

router.delete("/:id", requireAuth, deleteScreening);

export default router;
