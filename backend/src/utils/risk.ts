export type RiskLevel = "MINIMO"|"LEVE"|"MODERADO"|"MODERADAMENTE_GRAVE"|"GRAVE";

/**
 * Classifica o nível de risco baseado no score do PHQ-9
 * @param score - Score do PHQ-9 (0-27)
 * @returns Nível de risco correspondente
 * @throws Error se o score estiver fora do range válido (0-27)
 */
export function phq9Level(score: number): RiskLevel {
  if (score < 0 || score > 27) {
    throw new Error(`Score PHQ-9 inválido: ${score}. Deve estar entre 0 e 27.`);
  }
  if (score <= 4) return "MINIMO";  // 0-4: Depressão mínima
  if (score <= 9) return "LEVE";    // 5-9: Leve
  if (score <= 14) return "MODERADO";  // 10-14: Moderada
  if (score <= 19) return "MODERADAMENTE_GRAVE";  // 15-19: Moderadamente grave
  return "GRAVE";  // 20-27: Grave
}

/**
 * Classifica o nível de risco baseado no score do GAD-7
 * @param score - Score do GAD-7 (0-21)
 * @returns Nível de risco correspondente
 * @throws Error se o score estiver fora do range válido (0-21)
 */
export function gad7Level(score: number): RiskLevel {
  if (score < 0 || score > 21) {
    throw new Error(`Score GAD-7 inválido: ${score}. Deve estar entre 0 e 21.`);
  }
  if (score <= 4) return "MINIMO";  // 0-4: Ansiedade mínima
  if (score <= 9) return "LEVE";    // 5-9: Leve
  if (score <= 14) return "MODERADO";  // 10-14: Moderada
  return "GRAVE";  // 15-21: Grave
}
