import { z } from "zod";

/**
 * Valores posibles para el checklist
 */
export const ChecklistValueSchema = z.enum(["YES", "NO", "NA"]);
export type ChecklistValue = z.infer<typeof ChecklistValueSchema>;

/**
 * Tipo de operación inmobiliaria
 */
export const OperationTypeSchema = z.enum(["BUY", "SELL", "RENT"]);
export type OperationType = z.infer<typeof OperationTypeSchema>;

/**
 * Schema del formulario de valoración
 */
export const ReviewFormSchema = z.object({
  // 1. Identificación
  agencyName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  branchName: z.string().optional(),
  operationType: OperationTypeSchema,
  
  // Zona
  province: z.string().min(2, "La provincia es requerida"),
  city: z.string().min(2, "La ciudad es requerida"),
  neighborhood: z.string().optional(),

  // 2. Puntaje general (1-5)
  overallRating: z.number().int().min(1).max(5),

  // 3. Evaluación estructurada (checklist)
  // Transparencia
  feesClear: ChecklistValueSchema,
  noHiddenCosts: ChecklistValueSchema,
  
  // Cumplimiento
  metDeadlines: ChecklistValueSchema,
  docsOnTime: ChecklistValueSchema,
  
  // Trato
  professionalRespectful: ChecklistValueSchema,
  goodCommunication: ChecklistValueSchema,
  
  // Señales negativas
  unduePressure: ChecklistValueSchema,
  moneyWithheld: ChecklistValueSchema,
  abusivePractices: ChecklistValueSchema,

  // 4. Experiencia de servicio (1-5)
  accompanimentScore: z.number().int().min(1).max(5),
  responseTimeScore: z.number().int().min(1).max(5),
  problemResolutionScore: z.number().int().min(1).max(5),

  // 5. Comentario
  comment: z.string().min(50, "El comentario debe tener al menos 50 caracteres"),

  // 6. Recomendación - NPS (1-10)
  npsScore: z.number().int().min(1).max(10),

  // 7. Verificación (opcional)
  wantsVerification: z.boolean().default(false),
  documentUploaded: z.boolean().default(false),
});

export type ReviewForm = z.infer<typeof ReviewFormSchema>;

/**
 * Schema para el payload canonicalizado que se hashea
 */
export const CanonicalReviewPayloadSchema = z.object({
  agencyName: z.string(),
  branchName: z.string().optional(),
  operationType: OperationTypeSchema,
  province: z.string(),
  city: z.string(),
  neighborhood: z.string().optional(),
  overallRating: z.number(),
  feesClear: ChecklistValueSchema,
  noHiddenCosts: ChecklistValueSchema,
  metDeadlines: ChecklistValueSchema,
  docsOnTime: ChecklistValueSchema,
  professionalRespectful: ChecklistValueSchema,
  goodCommunication: ChecklistValueSchema,
  unduePressure: ChecklistValueSchema,
  moneyWithheld: ChecklistValueSchema,
  abusivePractices: ChecklistValueSchema,
  accompanimentScore: z.number(),
  responseTimeScore: z.number(),
  problemResolutionScore: z.number(),
  npsScore: z.number(),
  comment: z.string(),
  wantsVerification: z.boolean(),
  documentUploaded: z.boolean(),
  timestamp: z.string(), // ISO 8601
});

export type CanonicalReviewPayload = z.infer<typeof CanonicalReviewPayloadSchema>;

