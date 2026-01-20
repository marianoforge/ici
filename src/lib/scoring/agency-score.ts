/**
 * Datos de una review para el cálculo del ICI
 */
export interface ReviewData {
  overallRating: number; // 1-5
  compositeRating: number; // 1-5 (rating ponderado)
  accompanimentScore: number; // 1-5
  responseTimeScore: number; // 1-5
  problemResolutionScore: number; // 1-5
  npsScore: number; // 1-10
  positivesOverall: number; // 0-1
  severityPoints: number;
  isVerifiedOperation: boolean;
  createdAt: Date;
}

/**
 * Resultado del cálculo del ICI
 */
export interface ICIResult {
  ici: number; // 0-100
  evidence: number; // 0-1
  evidenceLevel: "A" | "B" | "C" | "D";
  iciAdjusted: number; // ICI ajustado para ranking
  details: {
    internalScore: number;
    bayesianRating: number;
    incidentPenalty: number;
    verifyFactor: number;
    recencyFactor: number;
    stabilityFactor: number;
    consistencyFactor: number;
    effectiveReviews: number;
    avgCompositeRating: number;
    avgNps: number;
  };
}

/**
 * Constantes del sistema
 */
const CONSTANTS = {
  // Bayesian rating
  MARKET_AVERAGE: 3.8, // C en la fórmula
  PRIOR_WEIGHT: 20, // m en la fórmula
  
  // Evidence
  EVIDENCE_DECAY: 15,
  VERIFIED_WEIGHT: 2,
  
  // Factores
  RECENCY_DAYS: 365,
  RECENCY_DECAY: 0.5,
  
  // Penalizaciones
  SEVERITY_PENALTY_FACTOR: 2.5,
};

/**
 * Calcula el rating bayesiano usando el composite rating
 * 
 * BayesRating = (n/(n+m))*R + (m/(n+m))*C
 * 
 * - R: promedio interno (composite rating ponderado)
 * - n: cantidad de reseñas
 * - C: promedio del mercado (3.8)
 * - m: prior (20)
 */
function calculateBayesianRating(
  reviews: ReviewData[]
): number {
  const n = reviews.length;
  const m = CONSTANTS.PRIOR_WEIGHT;
  const C = CONSTANTS.MARKET_AVERAGE;
  
  if (n === 0) {
    return C;
  }
  
  // Calcular promedio interno R usando composite rating
  const sum = reviews.reduce((acc, r) => acc + r.compositeRating, 0);
  const R = sum / n;
  
  // Aplicar fórmula bayesiana
  const bayesRating = (n / (n + m)) * R + (m / (n + m)) * C;
  
  return bayesRating;
}

/**
 * Calcula el promedio del NPS
 */
function calculateAverageNps(reviews: ReviewData[]): number {
  if (reviews.length === 0) return 5;
  const sum = reviews.reduce((acc, r) => acc + r.npsScore, 0);
  return sum / reviews.length;
}

/**
 * Calcula el factor de consistencia
 * Detecta reviews donde hay discrepancia entre overall rating y NPS
 * 
 * Si alguien da 5 estrellas pero NPS de 2, hay inconsistencia
 * Factor entre 0.85 y 1.0
 */
function calculateConsistencyFactor(reviews: ReviewData[]): number {
  if (reviews.length === 0) return 1;
  
  const consistencyScores = reviews.map((r) => {
    // Normalizar NPS (1-10) a escala 1-5
    const npsNormalized = ((r.npsScore - 1) / 9) * 4 + 1;
    
    // Diferencia absoluta entre overall y NPS normalizado
    const diff = Math.abs(r.overallRating - npsNormalized);
    
    // Máxima diferencia posible es 4 (1 vs 5)
    // Convertir a score de consistencia (0-1, donde 1 es perfectamente consistente)
    return 1 - (diff / 4);
  });
  
  const avgConsistency = consistencyScores.reduce((acc, c) => acc + c, 0) / consistencyScores.length;
  
  // Factor entre 0.85 y 1.0
  return 0.85 + avgConsistency * 0.15;
}

/**
 * Normaliza el rating bayesiano (1-5) a escala 0-100
 */
function normalizeToHundred(rating: number): number {
  // 1 → 0, 5 → 100
  return ((rating - 1) / 4) * 100;
}

/**
 * Calcula el factor de verificación
 */
function calculateVerifyFactor(reviews: ReviewData[]): number {
  const verifiedCount = reviews.filter((r) => r.isVerifiedOperation).length;
  const totalCount = reviews.length;
  
  if (totalCount === 0) return 1;
  
  const verifyRatio = verifiedCount / totalCount;
  
  // Factor entre 1.0 y 1.15
  return 1 + verifyRatio * 0.15;
}

/**
 * Calcula el factor de recencia
 */
function calculateRecencyFactor(reviews: ReviewData[]): number {
  if (reviews.length === 0) return 1;
  
  const now = new Date();
  const weights = reviews.map((r) => {
    const daysSince = (now.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const decay = Math.exp(-daysSince / CONSTANTS.RECENCY_DAYS);
    return Math.max(CONSTANTS.RECENCY_DECAY, decay);
  });
  
  const avgWeight = weights.reduce((acc, w) => acc + w, 0) / weights.length;
  
  return avgWeight;
}

/**
 * Calcula el factor de estabilidad usando composite rating
 */
function calculateStabilityFactor(reviews: ReviewData[]): number {
  if (reviews.length < 2) return 1;
  
  const ratings = reviews.map((r) => r.compositeRating);
  const mean = ratings.reduce((acc, r) => acc + r, 0) / ratings.length;
  
  const variance = ratings.reduce((acc, r) => acc + Math.pow(r - mean, 2), 0) / ratings.length;
  const stdDev = Math.sqrt(variance);
  
  // Menos variabilidad = más estabilidad
  // Factor entre 0.9 y 1.1
  const stabilityFactor = 1 + (0.1 - stdDev * 0.05);
  
  return Math.max(0.9, Math.min(1.1, stabilityFactor));
}

/**
 * Calcula la penalización por incidentes
 */
function calculateIncidentPenalty(reviews: ReviewData[]): number {
  const totalSeverity = reviews.reduce((acc, r) => acc + r.severityPoints, 0);
  
  // Penalización proporcional a la severidad
  const penalty = totalSeverity * CONSTANTS.SEVERITY_PENALTY_FACTOR;
  
  return Math.min(penalty, 50); // Máximo 50 puntos de penalización
}

/**
 * Calcula la evidencia (confianza del puntaje)
 * 
 * n_eff = n + 2 * verifiedCount
 * Evidence = 1 - exp(-n_eff / 15)
 */
function calculateEvidence(reviews: ReviewData[]): number {
  const n = reviews.length;
  const verifiedCount = reviews.filter((r) => r.isVerifiedOperation).length;
  
  const n_eff = n + CONSTANTS.VERIFIED_WEIGHT * verifiedCount;
  
  const evidence = 1 - Math.exp(-n_eff / CONSTANTS.EVIDENCE_DECAY);
  
  return Math.max(0, Math.min(1, evidence));
}

/**
 * Determina el nivel de evidencia
 */
function getEvidenceLevel(evidence: number): "A" | "B" | "C" | "D" {
  if (evidence >= 0.8) return "A"; // Alta
  if (evidence >= 0.6) return "B"; // Media
  if (evidence >= 0.4) return "C"; // Baja
  return "D"; // Muy baja
}

/**
 * Calcula el Índice de Confianza Inmobiliaria (ICI)
 * 
 * Fórmula robusta:
 * ICI = InternalScore × Factores - Penalizaciones
 * 
 * Donde InternalScore = Bayesian(CompositeRating) normalizado a 0-100
 * 
 * Factores:
 * - Verificación: +15% si hay documentación
 * - Recencia: Más peso a valoraciones recientes
 * - Estabilidad: Penaliza variabilidad extrema
 * - Consistencia: Penaliza discrepancias entre overall y NPS
 * 
 * @param reviews - Array de reviews de la agencia
 * @returns Resultado del cálculo del ICI
 */
export function calculateICI(reviews: ReviewData[]): ICIResult {
  // 1. Rating bayesiano (usando composite rating)
  const bayesianRating = calculateBayesianRating(reviews);
  
  // 2. Normalizar a 0-100
  let internalScore = normalizeToHundred(bayesianRating);
  
  // 3. Aplicar factores
  const verifyFactor = calculateVerifyFactor(reviews);
  const recencyFactor = calculateRecencyFactor(reviews);
  const stabilityFactor = calculateStabilityFactor(reviews);
  const consistencyFactor = calculateConsistencyFactor(reviews);
  
  internalScore = internalScore * verifyFactor * recencyFactor * stabilityFactor * consistencyFactor;
  
  // 4. Calcular penalizaciones
  const incidentPenalty = calculateIncidentPenalty(reviews);
  
  // 5. ICI final
  let ici = internalScore - incidentPenalty;
  ici = Math.max(0, Math.min(100, ici)); // Clamp entre 0-100
  
  // 6. Calcular evidencia
  const evidence = calculateEvidence(reviews);
  const evidenceLevel = getEvidenceLevel(evidence);
  
  // 7. ICI ajustado para ranking
  const iciAdjusted = ici * (0.75 + 0.25 * evidence);
  
  // 8. Métricas adicionales
  const verifiedCount = reviews.filter((r) => r.isVerifiedOperation).length;
  const effectiveReviews = reviews.length + CONSTANTS.VERIFIED_WEIGHT * verifiedCount;
  const avgCompositeRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.compositeRating, 0) / reviews.length
    : CONSTANTS.MARKET_AVERAGE;
  const avgNps = calculateAverageNps(reviews);
  
  return {
    ici: Math.round(ici * 100) / 100,
    evidence: Math.round(evidence * 100) / 100,
    evidenceLevel,
    iciAdjusted: Math.round(iciAdjusted * 100) / 100,
    details: {
      internalScore: Math.round(internalScore * 100) / 100,
      bayesianRating: Math.round(bayesianRating * 100) / 100,
      incidentPenalty: Math.round(incidentPenalty * 100) / 100,
      verifyFactor: Math.round(verifyFactor * 100) / 100,
      recencyFactor: Math.round(recencyFactor * 100) / 100,
      stabilityFactor: Math.round(stabilityFactor * 100) / 100,
      consistencyFactor: Math.round(consistencyFactor * 100) / 100,
      effectiveReviews: Math.round(effectiveReviews * 100) / 100,
      avgCompositeRating: Math.round(avgCompositeRating * 100) / 100,
      avgNps: Math.round(avgNps * 100) / 100,
    },
  };
}

