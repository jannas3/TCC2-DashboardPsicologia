import { prisma } from "../../db/prisma.js";
import { ScreeningDTO } from "./screening.validators.js";
import { phq9Level, gad7Level, RiskLevel } from "../../utils/risk.js";

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

  // Extrai telefone dos dados (pode vir do bot ou ser vazio)
  const telefone = (data.telefone as string | undefined)?.trim() || "";
  // Remove caracteres não numéricos (exceto + no início)
  const telefoneLimpo = telefone ? telefone.replace(/[^\d+]/g, '') : "";
  
  // 1) Garante o aluno no banco usando a matrícula como chave única
  const aluno = await prisma.student.upsert({
    where: { matricula: data.matricula },
    update: {
      nome,
      idade,
      telefone: telefoneLimpo || undefined, // Só atualiza se fornecido
      curso,
      periodo,
      // se o bot mandar telegram_id, salva/atualiza
      telegramId: data.telegram_id ?? undefined,
    },
    create: {
      nome,
      idade,
      telefone: telefoneLimpo || "", // Valor padrão vazio se não fornecido
      matricula: data.matricula,
      curso,
      periodo,
      telegramId: data.telegram_id ?? null,
    },
  });

  // 2) Recalcula score/risco no servidor (validação adicional de segurança)
  // Valida que cada resposta está entre 0-3
  if (data.phq9_respostas.some(r => r < 0 || r > 3)) {
    throw new Error("Respostas PHQ-9 devem estar entre 0 e 3");
  }
  if (data.gad7_respostas.some(r => r < 0 || r > 3)) {
    throw new Error("Respostas GAD-7 devem estar entre 0 e 3");
  }
  
  const phq9Score = data.phq9_respostas.reduce((a, b) => a + b, 0);
  const gad7Score = data.gad7_respostas.reduce((a, b) => a + b, 0);
  
  // Valida que os scores totais estão dentro dos limites
  if (phq9Score < 0 || phq9Score > 27) {
    throw new Error(`Score PHQ-9 inválido: ${phq9Score}. Deve estar entre 0 e 27.`);
  }
  if (gad7Score < 0 || gad7Score > 21) {
    throw new Error(`Score GAD-7 inválido: ${gad7Score}. Deve estar entre 0 e 21.`);
  }
  
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
      analiseIa: data.analise_ia ? (data.analise_ia as any) : null,
      riskPHQ9,
      riskGAD7,
    },
    include: {
      student: {
        select: { nome: true, matricula: true, idade: true, telefone: true, curso: true, periodo: true, telegramId: true },
      },
    },
  });

  return created;
}

/**
 * Mapeia nível de risco para um dos 3 níveis principais de ordenação.
 * Regra: GRAVE > MODERADO > LEVE
 * 
 * Mapeamento:
 * - GRAVE → GRAVE
 * - MODERADAMENTE_GRAVE → MODERADO
 * - MODERADO → MODERADO
 * - LEVE → LEVE
 * - MINIMO → LEVE
 */
type MainRiskLevel = "GRAVE" | "MODERADO" | "LEVE";

function mapToMainRiskLevel(risk: RiskLevel): MainRiskLevel {
  switch (risk) {
    case "GRAVE":
      return "GRAVE";
    case "MODERADAMENTE_GRAVE":
    case "MODERADO":
      return "MODERADO";
    case "LEVE":
    case "MINIMO":
      return "LEVE";
    default:
      return "LEVE";
  }
}

/**
 * Mapeia nível de risco principal para peso numérico para ordenação.
 * Prioridade: GRAVE (3) > MODERADO (2) > LEVE (1)
 */
function mapMainRiskToWeight(risk: MainRiskLevel): number {
  const weights: Record<MainRiskLevel, number> = {
    GRAVE: 3,
    MODERADO: 2,
    LEVE: 1,
  };
  return weights[risk] || 0;
}

/**
 * Obtém o maior nível de risco principal entre PHQ-9 e GAD-7.
 * Usa o risco mais alto para determinar a prioridade da triagem.
 */
function getMaxMainRiskLevel(riskPHQ9: RiskLevel, riskGAD7: RiskLevel): MainRiskLevel {
  const mainRiskPHQ9 = mapToMainRiskLevel(riskPHQ9);
  const mainRiskGAD7 = mapToMainRiskLevel(riskGAD7);
  
  const weightPHQ9 = mapMainRiskToWeight(mainRiskPHQ9);
  const weightGAD7 = mapMainRiskToWeight(mainRiskGAD7);
  
  return weightPHQ9 >= weightGAD7 ? mainRiskPHQ9 : mainRiskGAD7;
}

/**
 * Verifica se uma triagem é GRAVE (prioridade clínica alta).
 * Casos GRAVES: PHQ-9 >= 20 OU GAD-7 >= 15 OU PHQ-9 Q9 >= 1 (pensamentos de autolesão)
 */
function isGraveCase(screening: {
  phq9Score: number;
  gad7Score: number;
  phq9Respostas: number[];
}): boolean {
  // PHQ-9 >= 20 (Grave)
  if (screening.phq9Score >= 20) return true;
  
  // GAD-7 >= 15 (Grave)
  if (screening.gad7Score >= 15) return true;
  
  // PHQ-9 Q9 (pensamentos de autolesão) >= 1
  // Q9 é o índice 8 no array (0-indexed)
  if (screening.phq9Respostas && screening.phq9Respostas.length > 8 && screening.phq9Respostas[8] >= 1) {
    return true;
  }
  
  return false;
}

/**
 * Lista triagens recentes com dados básicos do aluno.
 * 
 * REGRA DE ORDENAÇÃO DAS TRIAGENS:
 * 
 * A listagem de triagens deve ser ordenada primeiramente pelo nível de risco:
 * - GRAVE (maior urgência)
 * - MODERADO
 * - LEVE
 * 
 * Quando houver mais de uma triagem com o mesmo nível de risco (seja Grave, Moderado ou Leve),
 * a ordenação deve usar a data/hora de criação (createdAt) em ordem crescente.
 * Ou seja, para qualquer risco empatado, quem chegou primeiro para a triagem aparece primeiro na lista.
 * 
 * @param limit - Número máximo de registros a retornar
 * @param status - Status específico para filtrar (opcional)
 * @param statusNot - Status a excluir (opcional)
 * @param riskLevel - Nível de risco para filtrar (opcional)
 */
export async function listScreenings(
  limit = 20, 
  status?: string, 
  statusNot?: string,
  riskLevel?: RiskLevel
) {
  const where: any = {};
  
  if (status) {
    where.status = status;
  } else if (statusNot) {
    where.status = { not: statusNot };
  } else {
    where.status = { not: "CONCLUIDA" };
  }

  // Aplica filtro por nível de risco se fornecido
  // Usa o maior risco entre PHQ-9 e GAD-7 para determinar o risco da triagem
  if (riskLevel) {
    // Filtra por risco: busca triagens onde riskPHQ9 OU riskGAD7 corresponde ao nível solicitado
    where.OR = [
      { riskPHQ9: riskLevel },
      { riskGAD7: riskLevel },
    ];
  }

  // Busca registros (sem limit inicial para poder ordenar corretamente)
  const fetchLimit = Math.max(limit * 4, 500);
  
  const allScreenings = await prisma.screening.findMany({
    take: fetchLimit,
    where,
    include: {
      student: {
        select: {
          id: true,
          nome: true,
          matricula: true,
          idade: true,
          telefone: true,
          curso: true,
          periodo: true,
          telegramId: true,
        },
      },
    },
  });

  // REGRA DE ORDENAÇÃO:
  // 1. Primeiro por nível de risco principal (GRAVE > MODERADO > LEVE)
  // 2. Em caso de empate no mesmo nível de risco, ordena por createdAt ASC (quem chegou primeiro aparece primeiro)
  allScreenings.sort((a, b) => {
    // Obtém o maior nível de risco principal entre PHQ-9 e GAD-7 para cada triagem
    const mainRiskA = getMaxMainRiskLevel(a.riskPHQ9, a.riskGAD7);
    const mainRiskB = getMaxMainRiskLevel(b.riskPHQ9, b.riskGAD7);
    
    // Compara por peso do risco principal (maior peso = maior prioridade)
    const weightA = mapMainRiskToWeight(mainRiskA);
    const weightB = mapMainRiskToWeight(mainRiskB);
    
    if (weightA !== weightB) {
      // Ordena por prioridade de risco (descendente: GRAVE primeiro)
      return weightB - weightA;
    }
    
    // Em caso de empate no mesmo nível de risco, ordena por createdAt ASC (crescente)
    // Quem chegou primeiro (createdAt menor) aparece primeiro na lista
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  // Aplica o limit após a ordenação
  return allScreenings.slice(0, limit);
}

export async function updateStatus(id: string, status: string) {
  return prisma.screening.update({
    where: { id },
    data: { status },
  });
}

export async function removeScreening(id: string) {
  return prisma.screening.delete({
    where: { id },
  });
}