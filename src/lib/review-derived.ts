import type { ChecklistValue, ReviewForm } from "@/schemas/review";

/**
 * Resultado de los campos derivados de una review
 */
export interface DerivedFields {
  positivesOverall: number;
  compositeRating: number;
  severityPoints: number;
  isVerifiedOperation: boolean;
}

/**
 * Pesos para el cálculo del rating compuesto
 * Total = 1.0 (100%)
 */
const COMPOSITE_WEIGHTS = {
  overallRating: 0.20,        // 20% - Puntaje general
  accompanimentScore: 0.15,   // 15% - Acompañamiento y confianza
  responseTimeScore: 0.15,    // 15% - Tiempo de respuesta
  problemResolutionScore: 0.15, // 15% - Gestión y resolución
  checklistScore: 0.20,       // 20% - Evaluación detallada (checklist)
  npsScore: 0.15,             // 15% - NPS (recomendación)
};

/**
 * Convierte un valor del checklist a número
 * YES → 1, NO → 0, NA → null (se ignora)
 */
function checklistToNumber(value: ChecklistValue): number | null {
  if (value === "YES") return 1;
  if (value === "NO") return 0;
  return null; // NA
}

/**
 * Calcula el promedio de un grupo de valores del checklist
 * Ignora los valores NA
 */
function calculateAverage(values: (number | null)[]): number | null {
  const validValues = values.filter((v) => v !== null) as number[];
  
  if (validValues.length === 0) {
    return null;
  }
  
  const sum = validValues.reduce((acc, val) => acc + val, 0);
  return sum / validValues.length;
}

/**
 * Normaliza NPS (1-10) a escala 1-5 para el cálculo compuesto
 */
function normalizeNpsTo5(nps: number): number {
  // 1-10 → 1-5: (nps - 1) / 9 * 4 + 1
  return ((nps - 1) / 9) * 4 + 1;
}

/**
 * Convierte positivesOverall (0-1) a escala 1-5
 */
function normalizePositivesTo5(positives: number): number {
  // 0-1 → 1-5
  return positives * 4 + 1;
}

/**
 * Calcula los campos derivados de una review
 */
export function calculateDerivedFields(review: ReviewForm): DerivedFields {
  // 1. Calcular sub-índices del checklist
  
  // Transparencia
  const transparencyValues = [
    checklistToNumber(review.feesClear),
    checklistToNumber(review.noHiddenCosts),
  ];
  const transparencyScore = calculateAverage(transparencyValues);
  
  // Cumplimiento
  const complianceValues = [
    checklistToNumber(review.metDeadlines),
    checklistToNumber(review.docsOnTime),
  ];
  const complianceScore = calculateAverage(complianceValues);
  
  // Trato
  const treatmentValues = [
    checklistToNumber(review.professionalRespectful),
    checklistToNumber(review.goodCommunication),
  ];
  const treatmentScore = calculateAverage(treatmentValues);
  
  // Promedio general de positivos (0-1)
  const allScores = [transparencyScore, complianceScore, treatmentScore].filter(
    (s) => s !== null
  ) as number[];
  
  const positivesOverall = allScores.length > 0
    ? allScores.reduce((acc, val) => acc + val, 0) / allScores.length
    : 0;
  
  // 2. Calcular severity points (señales negativas)
  let severityPoints = 0;
  
  if (review.unduePressure === "YES") {
    severityPoints += 2;
  }
  
  if (review.abusivePractices === "YES") {
    severityPoints += 4;
  }
  
  if (review.moneyWithheld === "YES") {
    severityPoints += 6;
  }
  
  // 3. Verificación
  const isVerifiedOperation = 
    review.wantsVerification === true && 
    review.documentUploaded === true;
  
  // 4. Calcular Composite Rating (ponderado, escala 1-5)
  // Todos los valores se normalizan a escala 1-5 antes de ponderar
  const checklistScore5 = normalizePositivesTo5(positivesOverall);
  const npsScore5 = normalizeNpsTo5(review.npsScore);
  
  const compositeRating = 
    COMPOSITE_WEIGHTS.overallRating * review.overallRating +
    COMPOSITE_WEIGHTS.accompanimentScore * review.accompanimentScore +
    COMPOSITE_WEIGHTS.responseTimeScore * review.responseTimeScore +
    COMPOSITE_WEIGHTS.problemResolutionScore * review.problemResolutionScore +
    COMPOSITE_WEIGHTS.checklistScore * checklistScore5 +
    COMPOSITE_WEIGHTS.npsScore * npsScore5;
  
  return {
    positivesOverall,
    compositeRating,
    severityPoints,
    isVerifiedOperation,
  };
}

