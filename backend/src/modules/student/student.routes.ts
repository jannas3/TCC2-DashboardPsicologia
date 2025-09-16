import { Router } from "express";
import { prisma } from "../../db/prisma.js"; // .js por causa do NodeNext/ESM

const router = Router();

/** GET /api/students?q=&limit= */
router.get("/", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  const take = Math.min(Number(req.query.limit ?? 200), 1000);

  const items = await prisma.student.findMany({
    take,
    orderBy: { createdAt: "desc" },
    where: q
      ? {
          OR: [
            { nome: { contains: q, mode: "insensitive" } },
            { matricula: { contains: q, mode: "insensitive" } },
            { curso: { contains: q, mode: "insensitive" } },
            { periodo: { contains: q, mode: "insensitive" } },
            { telegramId: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
  });

  res.json(items);
});

/** POST /api/students */
router.post("/", async (req, res) => {
  const { nome, idade, matricula, curso, periodo, telegramId } = req.body ?? {};
  if (!nome || !matricula || !curso || !periodo) {
    return res.status(400).json({ error: "Campos obrigatórios: nome, matricula, curso, periodo" });
  }
  const created = await prisma.student.create({
    data: { nome, idade: Number(idade ?? 0), matricula, curso, periodo, telegramId: telegramId ?? null },
  });
  res.status(201).json(created);
});

/** PATCH /api/students/:id */
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const patch: any = {};
  for (const k of ["nome", "idade", "matricula", "curso", "periodo", "telegramId"]) {
    if (k in req.body) patch[k] = req.body[k];
  }
  const updated = await prisma.student.update({ where: { id }, data: patch });
  res.json(updated);
});

/** DELETE /api/students/:id */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await prisma.student.delete({ where: { id } });
  res.status(204).send();
});

export default router;
