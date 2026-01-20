import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateICI, type ReviewData } from "@/lib/scoring/agency-score";

/**
 * GET /api/agencies/[agencyId]/score
 * 
 * Calcula y devuelve el ICI de una agencia
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agencyId: string }> }
) {
  try {
    const { agencyId } = await params;
    
    // 1. Buscar la agencia
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      include: {
        reviews: {
          where: { status: "VISIBLE" },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    
    if (!agency) {
      return NextResponse.json(
        { error: "Agencia no encontrada" },
        { status: 404 }
      );
    }
    
    // 2. Convertir reviews al formato esperado por calculateICI
    const reviewsData: ReviewData[] = agency.reviews.map((review) => ({
      overallRating: review.overallRating,
      compositeRating: review.compositeRating || review.overallRating, // fallback para reviews antiguas
      accompanimentScore: review.accompanimentScore || 3,
      responseTimeScore: review.responseTimeScore || 3,
      problemResolutionScore: review.problemResolutionScore || 3,
      npsScore: review.npsScore || 5,
      positivesOverall: review.positivesOverall || 0,
      severityPoints: review.severityPoints,
      isVerifiedOperation: review.isVerifiedOperation,
      createdAt: review.createdAt,
    }));
    
    // 3. Calcular ICI
    const iciResult = calculateICI(reviewsData);
    
    // 4. Responder
    return NextResponse.json({
      agency: {
        id: agency.id,
        name: agency.name,
        branchName: agency.branchName,
      },
      totalReviews: agency.reviews.length,
      ici: iciResult.ici,
      evidence: iciResult.evidence,
      evidenceLevel: iciResult.evidenceLevel,
      iciAdjusted: iciResult.iciAdjusted,
      details: iciResult.details,
    });
    
  } catch (error) {
    console.error("Error calculating ICI:", error);
    
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

