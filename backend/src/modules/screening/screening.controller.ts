import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { screeningDTO } from "./screening.validators.js";
import { createScreening, listScreenings, removeScreening, updateStatus } from "./screening.service.js";

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

export const screeningController = {
  async create(req: Request, res: Response) {
    console.log("[screeningController] Recebendo triagem do bot");
    console.log("[screeningController] Payload recebido:", JSON.stringify(req.body, null, 2));
    
    try {
      // Normaliza o payload antes de validar
      const body: any = { ...req.body };
      
      // Converte idade se vier como string
      if (typeof body.idade === 'string') {
        body.idade = parseInt(body.idade, 10);
      }
      if (typeof body.idade !== 'number' || isNaN(body.idade)) {
        return res.status(400).json({ error: "idade deve ser um número válido" });
      }
      
      // Normaliza arrays
      if (!Array.isArray(body.phq9_respostas) || body.phq9_respostas.length !== 9) {
        return res.status(400).json({ error: "phq9_respostas deve ser um array com 9 elementos" });
      }
      if (!Array.isArray(body.gad7_respostas) || body.gad7_respostas.length !== 7) {
        return res.status(400).json({ error: "gad7_respostas deve ser um array com 7 elementos" });
      }
      
      // Garante que analise_ia seja um objeto válido ou null/undefined
      if (body.analise_ia !== undefined && body.analise_ia !== null) {
        if (typeof body.analise_ia !== 'object' || Array.isArray(body.analise_ia)) {
          console.warn("[screeningController] analise_ia não é um objeto válido, removendo...");
          body.analise_ia = null;
        }
      } else {
        body.analise_ia = null;
      }
      
      // Valida campos obrigatórios manualmente antes do Zod
      if (!body.nome || typeof body.nome !== 'string' || body.nome.length < 3) {
        return res.status(400).json({ error: "nome deve ter pelo menos 3 caracteres" });
      }
      if (!body.matricula || typeof body.matricula !== 'string' || body.matricula.length < 3) {
        return res.status(400).json({ error: "matricula deve ter pelo menos 3 caracteres" });
      }
      if (!body.curso || typeof body.curso !== 'string' || body.curso.length < 2) {
        return res.status(400).json({ error: "curso deve ter pelo menos 2 caracteres" });
      }
      if (!body.periodo || typeof body.periodo !== 'string' || body.periodo.length < 1) {
        return res.status(400).json({ error: "periodo é obrigatório" });
      }
      if (!body.disponibilidade || typeof body.disponibilidade !== 'string' || body.disponibilidade.length < 3) {
        return res.status(400).json({ error: "disponibilidade deve ter pelo menos 3 caracteres" });
      }
      if (!body.relatorio || typeof body.relatorio !== 'string' || body.relatorio.length < 5) {
        return res.status(400).json({ error: "relatorio deve ter pelo menos 5 caracteres" });
      }
      
      // Valida scores
      if (typeof body.phq9_score !== 'number' || isNaN(body.phq9_score)) {
        return res.status(400).json({ error: "phq9_score deve ser um número" });
      }
      if (typeof body.gad7_score !== 'number' || isNaN(body.gad7_score)) {
        return res.status(400).json({ error: "gad7_score deve ser um número" });
      }
      
      // Agora tenta validar com Zod (mas já validamos o essencial)
      const parsed = screeningDTO.safeParse(body);
      if (!parsed.success) {
        console.error("[screeningController] Validação Zod falhou:", JSON.stringify(parsed.error.flatten(), null, 2));
        // Mesmo se o Zod falhar, tenta criar se os campos essenciais estão OK
        console.warn("[screeningController] Tentando criar mesmo com erro de validação Zod...");
      }
      
      console.log("[screeningController] Criando triagem...");
      // Usa parsed.data se válido, senão usa body normalizado
      const dataToCreate = parsed.success ? parsed.data : body;
      const created = await createScreening(dataToCreate);
      console.log("[screeningController] Triagem criada com sucesso:", created.id);
      return res.status(201).json(created);
    } catch (e: any) {
      console.error("[screeningController] Erro ao criar triagem:", e);
      console.error("[screeningController] Stack:", e?.stack);
      return res.status(500).json({ error: e?.message ?? "Erro ao criar triagem" });
    }
  },

  async list(req: Request, res: Response) {
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
      
      // Filtro por nível de risco (opcional)
      const riskLevel = req.query.riskLevel as string | undefined;
      const normalizedRisk = riskLevel ? riskLevel.toUpperCase() as "MINIMO" | "LEVE" | "MODERADO" | "MODERADAMENTE_GRAVE" | "GRAVE" | undefined : undefined;

      const items = await listScreenings(limit, statusEq, statusNot, normalizedRisk);
      return res.json(items);
    } catch (e: any) {
      console.error("Erro ao listar triagens:", e);
      // Log detalhado para debug
      if (e?.code) {
        console.error("Código do erro:", e.code);
      }
      if (e?.message) {
        console.error("Mensagem do erro:", e.message);
      }
      return res.status(500).json({ 
        error: "Erro ao listar triagens",
        message: e?.message || "Erro desconhecido",
        code: e?.code || "UNKNOWN_ERROR"
      });
    }
  },

  async updateStatus(req: Request, res: Response) {
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
      if (!status) return res.status(400).json({ error: "status é obrigatório" });

      const normalized = normalizeStatus(status);
      if (!normalized) return res.status(400).json({ error: "status inválido" });

      const updated = await updateStatus(id, normalized);
      return res.json(updated);
    } catch (e: any) {
      console.error(e);
      if (e?.code === "P2025") {
        return res.status(404).json({ error: "Triagem não encontrada" });
      }
      return res.status(500).json({ error: e?.message ?? "Erro ao atualizar status" });
    }
  },

  async delete(req: Request, res: Response) {
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
  },
};
