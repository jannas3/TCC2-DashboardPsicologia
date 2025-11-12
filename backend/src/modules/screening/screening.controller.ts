import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { screeningDTO } from "./screening.validators.js";
import { createScreening, listScreenings, removeScreening } from "./screening.service.js";

export async function postScreening(req: Request, res: Response) {
  const parsed = screeningDTO.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid payload", details: parsed.error.flatten() });
  }
  const created = await createScreening(parsed.data);
  return res.status(201).json(created);
}

export async function getScreenings(req: Request, res: Response) {
  const limit = Number(req.query.limit ?? 20);
  const items = await listScreenings(Number.isFinite(limit) ? limit : 20);
  return res.json(items);
}

export async function deleteScreening(req: Request, res: Response) {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "id é obrigatório" });
  }
  try {
    await removeScreening(id);
    return res.status(204).send();
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ error: "Triagem não encontrada" });
    }
    return res.status(409).json({ error: error?.message ?? "Não foi possível remover a triagem" });
  }
}
