import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateICI, type ReviewData } from "@/lib/scoring/agency-score";

/**
 * GET /api/agencies/ranking
 *
 * Lista agencias con al menos 1 valoración, ordenadas por ICI ajustado
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const agencies = await prisma.agency.findMany({
      include: {
        reviews: {
          where: { status: "VISIBLE" },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const withScore = agencies
      .filter((a) => a.reviews.length > 0)
      .map((agency) => {
        const reviewsData: ReviewData[] = agency.reviews.map((r) => ({
          overallRating: r.overallRating,
          compositeRating: r.compositeRating ?? r.overallRating,
          accompanimentScore: r.accompanimentScore ?? 3,
          responseTimeScore: r.responseTimeScore ?? 3,
          problemResolutionScore: r.problemResolutionScore ?? 3,
          npsScore: r.npsScore ?? 5,
          positivesOverall: r.positivesOverall ?? 0,
          severityPoints: r.severityPoints,
          isVerifiedOperation: r.isVerifiedOperation,
          createdAt: r.createdAt,
        }));

        const result = calculateICI(reviewsData);

        return {
          id: agency.id,
          name: agency.name,
          province: agency.province,
          city: agency.city,
          neighborhood: agency.neighborhood,
          totalReviews: agency.reviews.length,
          verifiedCount: agency.reviews.filter((r) => r.isVerifiedOperation).length,
          ici: result.ici,
          evidenceLevel: result.evidenceLevel,
          iciAdjusted: result.iciAdjusted,
        };
      });

    withScore.sort((a, b) => b.iciAdjusted - a.iciAdjusted);

    return NextResponse.json({
      agencies: withScore.slice(0, limit),
      total: withScore.length,
    });
  } catch (error) {
    console.error("Error fetching ranking:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
