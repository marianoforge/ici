import { prisma } from "@/lib/prisma";
import { calculateICI, type ReviewData } from "@/lib/scoring/agency-score";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

type AgencyWithReviews = Prisma.AgencyGetPayload<{
  include: { reviews: true };
}>;

type Review = AgencyWithReviews["reviews"][number];

interface PageProps {
  params: Promise<{ agencyId: string }>;
}

export default async function AgencyPage({ params }: PageProps) {
  const { agencyId } = await params;
  
  // Buscar la agencia con sus reviews
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
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Agencia no encontrada
            </h1>
            <p className="text-gray-600 mb-6">
              No pudimos encontrar la agencia que buscas
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Calcular ICI
  const reviewsData: ReviewData[] = agency.reviews.map((review: Review) => ({
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

  const iciResult = calculateICI(reviewsData);

  // Determinar color según el ICI
  const getICIColor = (ici: number) => {
    if (ici >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (ici >= 60) return "text-blue-600 bg-blue-50 border-blue-200";
    if (ici >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getEvidenceColor = (level: string) => {
    if (level === "A") return "text-green-700 bg-green-100";
    if (level === "B") return "text-blue-700 bg-blue-100";
    if (level === "C") return "text-yellow-700 bg-yellow-100";
    return "text-red-700 bg-red-100";
  };

  const getEvidenceLabel = (level: string) => {
    if (level === "A") return "Alta";
    if (level === "B") return "Media";
    if (level === "C") return "Baja";
    return "Muy Baja";
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {agency.name}
              </h1>
              {agency.branchName && (
                <p className="text-lg text-gray-600">{agency.branchName}</p>
              )}
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Volver
            </Link>
          </div>

          {/* ICI Score */}
          <div className={`p-6 rounded-lg border-2 ${getICIColor(iciResult.ici)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide mb-1">
                  Índice de Confianza Inmobiliaria
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold">
                    {iciResult.ici}
                  </span>
                  <span className="text-2xl font-semibold">/ 100</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium mb-2">Nivel de Evidencia</p>
                <span className={`inline-block px-4 py-2 rounded-lg font-semibold ${getEvidenceColor(iciResult.evidenceLevel)}`}>
                  {getEvidenceLabel(iciResult.evidenceLevel)} ({Math.round(iciResult.evidence * 100)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{agency.reviews.length}</p>
              <p className="text-sm text-gray-600">Valoraciones</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {agency.reviews.filter(r => r.isVerifiedOperation).length}
              </p>
              <p className="text-sm text-gray-600">Verificadas</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">
                {iciResult.iciAdjusted}
              </p>
              <p className="text-sm text-gray-600">ICI Ajustado</p>
            </div>
          </div>
        </div>

        {/* Detalles del cálculo */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Detalles del Cálculo
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Rating Bayesiano</p>
              <p className="text-xl font-semibold text-gray-900">
                {iciResult.details.bayesianRating} / 5
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Score Interno</p>
              <p className="text-xl font-semibold text-gray-900">
                {iciResult.details.internalScore}
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Factor de Verificación</p>
              <p className="text-xl font-semibold text-gray-900">
                {iciResult.details.verifyFactor}x
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Factor de Recencia</p>
              <p className="text-xl font-semibold text-gray-900">
                {iciResult.details.recencyFactor}x
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Factor de Estabilidad</p>
              <p className="text-xl font-semibold text-gray-900">
                {iciResult.details.stabilityFactor}x
              </p>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 mb-1">Penalización por Incidentes</p>
              <p className="text-xl font-semibold text-red-900">
                -{iciResult.details.incidentPenalty}
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              <strong>Reseñas Efectivas:</strong> {iciResult.details.effectiveReviews} 
              <span className="text-blue-700 ml-2">
                (las verificadas cuentan doble)
              </span>
            </p>
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Valoraciones ({agency.reviews.length})
          </h2>
          
          {agency.reviews.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              Aún no hay valoraciones para esta inmobiliaria
            </p>
          ) : (
            <div className="space-y-6">
              {agency.reviews.map((review) => (
                <div
                  key={review.reviewId}
                  className="p-6 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={i < review.overallRating ? "text-yellow-500" : "text-gray-300"}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {review.overallRating}/5
                      </span>
                    </div>
                    {review.isVerifiedOperation && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        ✓ Verificada
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-800 mb-4">{review.comment}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{review.operationType === "BUY" ? "Compra" : review.operationType === "SELL" ? "Venta" : "Alquiler"}</span>
                    <span>•</span>
                    <span>{review.city}, {review.province}</span>
                    {review.neighborhood && (
                      <>
                        <span>•</span>
                        <span>{review.neighborhood}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{new Date(review.createdAt).toLocaleDateString("es-AR")}</span>
                  </div>
                  
                  {review.severityPoints > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        ⚠️ Esta valoración reporta incidentes graves (severidad: {review.severityPoints})
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            ℹ️ Sobre el Índice de Confianza Inmobiliaria (ICI)
          </h3>
          <p className="text-sm text-blue-800">
            El ICI no es un simple promedio de estrellas. Utiliza un rating bayesiano que considera
            la cantidad de valoraciones, su recencia, estabilidad, verificación y penaliza incidentes graves.
            El nivel de evidencia indica qué tan confiable es el puntaje según la cantidad de datos disponibles.
          </p>
        </div>
      </div>
    </main>
  );
}

