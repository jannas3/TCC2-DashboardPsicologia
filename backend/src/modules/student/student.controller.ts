import { Request, Response } from "express";
import { studentService } from "./student.service.js";

export const studentController = {
  async list(req: Request, res: Response) {
    try {
      const q = String(req.query.q ?? "").trim();
      const limit = Number(req.query.limit ?? 200);
      const items = await studentService.list({ q, limit });
      return res.json(items);
    } catch (e: any) {
      console.error("[studentController] Erro ao listar alunos:", e);
      console.error("[studentController] Código do erro:", e?.code);
      console.error("[studentController] Mensagem:", e?.message);
      console.error("[studentController] Stack:", e?.stack);
      
      // Mensagem mais específica para erros de migração
      if (e?.message?.includes('telefone') || e?.message?.includes('column') || e?.code === '42703' || e?.code === 'P2021') {
        return res.status(500).json({ 
          message: "Erro ao listar alunos: campo telefone não encontrado no banco de dados. Aplique a migração: npx prisma migrate deploy",
          error: e?.message,
          code: e?.code
        });
      }
      
      return res.status(500).json({ 
        message: "Erro ao listar alunos",
        error: e?.message || "Erro desconhecido",
        code: e?.code || "UNKNOWN_ERROR"
      });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { nome, idade, telefone, matricula, curso, periodo, telegramId } = req.body ?? {};
      
      // Validações obrigatórias
      if (!nome || !matricula || !curso || !periodo) {
        return res.status(400).json({
          error: "Campos obrigatórios: nome, matricula, curso, periodo",
        });
      }
      
      // Validação de idade
      const idadeNum = Number(idade);
      if (!idade || isNaN(idadeNum) || idadeNum < 10 || idadeNum > 100) {
        return res.status(400).json({
          error: "Idade deve ser um número entre 10 e 100",
        });
      }
      
      // Validação de telefone
      if (!telefone || typeof telefone !== 'string') {
        return res.status(400).json({
          error: "Telefone é obrigatório",
        });
      }
      
      // Remove caracteres não numéricos (exceto + no início)
      const telefoneLimpo = telefone.trim();
      const telefoneNumeros = telefoneLimpo.replace(/[^\d+]/g, '');
      if (telefoneNumeros.length < 8) {
        return res.status(400).json({
          error: "Telefone deve ter no mínimo 8 dígitos",
        });
      }
      
      const created = await studentService.create({
        nome,
        idade: idadeNum,
        telefone: telefoneNumeros,
        matricula,
        curso,
        periodo,
        telegramId: telegramId ?? null,
      });
      return res.status(201).json(created);
    } catch (e: any) {
      console.error(e);
      if (e?.code === 'P2002') {
        return res.status(409).json({ message: "Matrícula já cadastrada" });
      }
      return res.status(500).json({ message: "Erro ao criar aluno" });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const patch: any = {};
      
      // Valida idade se fornecida
      if ('idade' in req.body) {
        const idadeNum = Number(req.body.idade);
        if (isNaN(idadeNum) || idadeNum < 10 || idadeNum > 100) {
          return res.status(400).json({
            error: "Idade deve ser um número entre 10 e 100",
          });
        }
        patch.idade = idadeNum;
      }
      
      // Valida telefone se fornecido
      if ('telefone' in req.body) {
        const telefone = String(req.body.telefone).trim();
        const telefoneNumeros = telefone.replace(/[^\d+]/g, '');
        if (telefoneNumeros.length < 8) {
          return res.status(400).json({
            error: "Telefone deve ter no mínimo 8 dígitos",
          });
        }
        patch.telefone = telefoneNumeros;
      }
      
      // Outros campos
      for (const k of ["nome", "matricula", "curso", "periodo", "telegramId"]) {
        if (k in req.body) patch[k] = req.body[k];
      }
      
      const updated = await studentService.update(id, patch);
      return res.json(updated);
    } catch (e: any) {
      if (e?.code === "P2025") {
        return res.status(404).json({ message: "Aluno não encontrado" });
      }
      if (e?.code === 'P2002') {
        return res.status(409).json({ message: "Matrícula já cadastrada" });
      }
      console.error(e);
      return res.status(500).json({ message: "Erro ao atualizar aluno" });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await studentService.delete(id);
      return res.status(204).send();
    } catch (e: any) {
      if (e?.code === "P2025") {
        return res.status(404).json({ message: "Aluno não encontrado" });
      }
      console.error(e);
      return res.status(500).json({ message: "Erro ao excluir aluno" });
    }
  },
};

