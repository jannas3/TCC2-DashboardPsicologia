import { z } from "zod";

// Schema simplificado para evitar problemas com Zod v4
// Validação manual é feita no controller antes de chamar este schema
export const screeningDTO = z.object({
  nome: z.string().min(3),
  idade: z.number().int().min(1),
  telefone: z.string().optional(), // Opcional no bot (será obrigatório depois)
  matricula: z.string().min(3),
  curso: z.string().min(2),
  periodo: z.string().min(1),

  phq9_respostas: z.array(z.number().int().min(0).max(3)).length(9),
  gad7_respostas: z.array(z.number().int().min(0).max(3)).length(7),
  phq9_score: z.number().int(),
  gad7_score: z.number().int(),

  disponibilidade: z.string().min(3),
  observacao: z.string().optional().nullable(),

  relatorio: z.string().min(5),
  telegram_id: z.string().optional().nullable(),
  analise_ia: z.unknown().optional().nullable() // Usa unknown ao invés de any
}).passthrough(); // Permite campos extras

export type ScreeningDTO = z.infer<typeof screeningDTO>;
