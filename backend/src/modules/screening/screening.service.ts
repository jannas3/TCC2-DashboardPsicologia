import { prisma } from "../../db/prisma.js";
import { ScreeningDTO } from "./screening.validators.js";
import { phq9Level, gad7Level } from "../../utils/risk.js";

/**
 * Cria (ou atualiza aluno) e registra a triagem.
 * Recalcula os escores no servidor e determina os níveis de risco.
 * Retorna um objeto enxuto para o chamador (id/createdAt/níveis).
 */
export async function createScreening(data: ScreeningDTO) {
  const nome = data.nome.trim();
  const curso = data.curso.trim();
  const periodo = data.periodo.trim();
  const idade = Number.isFinite(data.idade) ? data.idade : 0;
  const observacao = (data.observacao ?? "").trim() || null;

  // 1) Garante o aluno no banco usando a matrícula como chave única
  const aluno = await prisma.student.upsert({
    where: { matricula: data.matricula },
    update: {
      nome,
      idade,
      curso,
      periodo,
      // se o bot mandar telegram_id, salva/atualiza
      telegramId: data.telegram_id ?? undefined,
    },
    create: {
      nome,
      idade,
      matricula: data.matricula,
      curso,
      periodo,
      telegramId: data.telegram_id ?? null,
    },
  });

  // 2) Recalcula score/risco no servidor
  const phq9Score = data.phq9_respostas.reduce((a, b) => a + b, 0);
  const gad7Score = data.gad7_respostas.reduce((a, b) => a + b, 0);
  const riskPHQ9 = phq9Level(phq9Score);
  const riskGAD7 = gad7Level(gad7Score);

  // 3) Cria a triagem vinculada
  const created = await prisma.screening.create({
    data: {
      studentId: aluno.id,
      phq9Respostas: data.phq9_respostas,
      gad7Respostas: data.gad7_respostas,
      phq9Score,
      gad7Score,
      disponibilidade: data.disponibilidade,
      observacao,
      relatorio: data.relatorio,
      riskPHQ9,
      riskGAD7,
    },
    include: {
      student: {
        select: { nome: true, matricula: true, curso: true, periodo: true, telegramId: true },
      },
    },
  });

  return created;
}

/**
 * Lista triagens recentes com dados básicos do aluno.
 */
export async function listScreenings(limit = 20) {
  return prisma.screening.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    where: { status: { not: "CONCLUIDA" } },
    include: {
      student: {
        select: { nome: true, matricula: true, curso: true, periodo: true },
      },
    },
  });
}

export async function removeScreening(id: string) {
  return prisma.screening.delete({
    where: { id },
  });
}