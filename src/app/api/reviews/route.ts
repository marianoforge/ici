import { NextRequest, NextResponse } from "next/server";
import { ReviewFormSchema, type CanonicalReviewPayload } from "@/schemas/review";
import { calculateDerivedFields } from "@/lib/review-derived";
import { canonicalJSON } from "@/lib/canonical-json";
import { sha256 } from "@/lib/hash";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/reviews
 * 
 * Crea una nueva review de una inmobiliaria
 * 
 * Flujo:
 * 1. Validar payload (Zod)
 * 2. Buscar o crear la agencia
 * 3. Calcular campos derivados
 * 4. Canonicalizar JSON
 * 5. Generar hash
 * 6. Guardar evento
 * 7. Guardar proyección
 * 8. Responder con reviewId y eventHash
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parsear y validar el body
    const body = await request.json();
    const validationResult = ReviewFormSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }
    
    const reviewData = validationResult.data;
    
    // 2. Buscar o crear la agencia
    let agency = await prisma.agency.findFirst({
      where: {
        name: reviewData.agencyName,
        branchName: reviewData.branchName || null,
      },
    });
    
    if (!agency) {
      agency = await prisma.agency.create({
        data: {
          name: reviewData.agencyName,
          branchName: reviewData.branchName,
        },
      });
    }
    
    // 3. Calcular campos derivados
    const derived = calculateDerivedFields(reviewData);
    
    // 4. Generar ID único para la review
    const reviewId = crypto.randomUUID();
    
    // 5. Crear payload canónico con timestamp
    const timestamp = new Date().toISOString();
    const canonicalPayload: CanonicalReviewPayload = {
      agencyName: reviewData.agencyName,
      branchName: reviewData.branchName,
      operationType: reviewData.operationType,
      province: reviewData.province,
      city: reviewData.city,
      neighborhood: reviewData.neighborhood,
      overallRating: reviewData.overallRating,
      feesClear: reviewData.feesClear,
      noHiddenCosts: reviewData.noHiddenCosts,
      metDeadlines: reviewData.metDeadlines,
      docsOnTime: reviewData.docsOnTime,
      professionalRespectful: reviewData.professionalRespectful,
      goodCommunication: reviewData.goodCommunication,
      unduePressure: reviewData.unduePressure,
      moneyWithheld: reviewData.moneyWithheld,
      abusivePractices: reviewData.abusivePractices,
      comment: reviewData.comment,
      wantsVerification: reviewData.wantsVerification,
      documentUploaded: reviewData.documentUploaded,
      timestamp,
    };
    
    // 6. Canonicalizar y hashear
    const payloadJson = canonicalJSON(canonicalPayload);
    const eventHash = await sha256(payloadJson);
    
    // 7. Obtener el hash del último evento de la agencia (para la cadena)
    const lastEvent = await prisma.reviewEvent.findFirst({
      where: { agencyId: agency.id },
      orderBy: { createdAt: "desc" },
      select: { eventHash: true },
    });
    
    const prevHash = lastEvent?.eventHash || null;
    
    // 8. Guardar evento (inmutable)
    const event = await prisma.reviewEvent.create({
      data: {
        eventType: "REVIEW_CREATED",
        reviewId,
        agencyId: agency.id,
        payloadJson,
        prevHash,
        eventHash,
        signature: null, // POC: sin firma
      },
    });
    
    // 9. Guardar proyección (mutable, para queries rápidas)
    await prisma.reviewProjection.create({
      data: {
        reviewId,
        agencyId: agency.id,
        overallRating: reviewData.overallRating,
        comment: reviewData.comment,
        province: reviewData.province,
        city: reviewData.city,
        neighborhood: reviewData.neighborhood,
        operationType: reviewData.operationType,
        positivesOverall: derived.positivesOverall,
        severityPoints: derived.severityPoints,
        isVerifiedOperation: derived.isVerifiedOperation,
        status: "VISIBLE",
      },
    });
    
    // 10. Responder
    return NextResponse.json(
      {
        success: true,
        reviewId,
        eventHash,
        agencyId: agency.id,
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Error creating review:", error);
    
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reviews?agencyId=xxx
 * 
 * Obtiene las reviews de una agencia
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get("agencyId");
    
    if (!agencyId) {
      return NextResponse.json(
        { error: "agencyId es requerido" },
        { status: 400 }
      );
    }
    
    const reviews = await prisma.reviewProjection.findMany({
      where: {
        agencyId,
        status: "VISIBLE",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json({ reviews });
    
  } catch (error) {
    console.error("Error fetching reviews:", error);
    
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

