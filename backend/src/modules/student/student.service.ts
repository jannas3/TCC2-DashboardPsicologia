import { prisma } from "../../db/prisma.js";

export interface StudentListParams {
  q?: string;
  limit?: number;
}

export interface StudentCreateData {
  nome: string;
  idade: number;
  telefone: string;
  matricula: string;
  curso: string;
  periodo: string;
  telegramId?: string | null;
}

export interface StudentUpdateData {
  nome?: string;
  idade?: number;
  telefone?: string;
  matricula?: string;
  curso?: string;
  periodo?: string;
  telegramId?: string | null;
}

export const studentService = {
  async list(params?: StudentListParams) {
    const q = String(params?.q ?? "").trim();
    const take = Math.min(Number(params?.limit ?? 200), 1000);

    try {
      return prisma.student.findMany({
        take,
        orderBy: { createdAt: "desc" },
        where: q
          ? {
              OR: [
                { nome: { contains: q, mode: "insensitive" } },
                { matricula: { contains: q, mode: "insensitive" } },
                { telefone: { contains: q, mode: "insensitive" } },
                { curso: { contains: q, mode: "insensitive" } },
                { periodo: { contains: q, mode: "insensitive" } },
                { telegramId: { contains: q, mode: "insensitive" } },
              ],
            }
          : undefined,
      });
    } catch (error: any) {
      // Se o campo telefone não existir ainda (migração não aplicada), tenta sem ele
      if (error?.code === 'P2021' || error?.message?.includes('telefone') || error?.message?.includes('column') || error?.code === '42703') {
        console.warn('[studentService] Campo telefone não encontrado, tentando sem ele. Aplique a migração!');
        return prisma.student.findMany({
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
      }
      throw error;
    }
  },

  async create(data: StudentCreateData) {
    try {
      return prisma.student.create({
        data: {
          nome: data.nome,
          idade: data.idade,
          telefone: data.telefone,
          matricula: data.matricula,
          curso: data.curso,
          periodo: data.periodo,
          telegramId: data.telegramId ?? null,
        },
      });
    } catch (error: any) {
      // Se o campo telefone não existir ainda (migração não aplicada)
      if (error?.code === 'P2021' || error?.message?.includes('telefone') || error?.message?.includes('column') || error?.code === '42703') {
        throw new Error('Campo telefone não encontrado no banco de dados. Por favor, aplique a migração: npx prisma migrate deploy');
      }
      throw error;
    }
  },

  async update(id: string, data: StudentUpdateData) {
    const patch: any = {};
    for (const k of ["nome", "idade", "telefone", "matricula", "curso", "periodo", "telegramId"]) {
      if (k in data) patch[k] = data[k as keyof StudentUpdateData];
    }
    return prisma.student.update({ where: { id }, data: patch });
  },

  async delete(id: string) {
    return prisma.student.delete({ where: { id } });
  },

  async findById(id: string) {
    return prisma.student.findUnique({ where: { id } });
  },
};

