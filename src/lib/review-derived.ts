import type { ChecklistValue, ReviewForm } from "@/schemas/review";

/**
 * Resultado de los campos derivados de una review
 */
export interface DerivedFields {
  positivesOverall: number;
  severityPoints: number;
  isVerifiedOperation: boolean;
}

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
  
  return {
    positivesOverall,
    severityPoints,
    isVerifiedOperation,
  };
}

