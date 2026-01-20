import Link from "next/link";
import { HomeSearch } from "@/components/home-search";
import { prisma } from "@/lib/prisma";
import { calculateICI, type ReviewData } from "@/lib/scoring/agency-score";

interface AgencyRanking {
  id: string;
  name: string;
  province?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  totalReviews: number;
  verifiedCount: number;
  ici: number;
  evidenceLevel: string;
  iciAdjusted: number;
}

// Datos para el ranking - fetched server-side
async function getRanking(): Promise<AgencyRanking[]> {
  try {
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

    return withScore.slice(0, 50);
  } catch (error) {
    console.error("Error fetching ranking:", error);
    return [];
  }
}

// Marcar como dinámica para que siempre obtenga datos frescos
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const agencies = await getRanking();

  const getICIColor = (ici: number) => {
    if (ici >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (ici >= 60) return "text-blue-600 bg-blue-50 border-blue-200";
    if (ici >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getEvidenceColor = (level: string) => {
    if (level === "A") return "bg-green-100 text-green-800";
    if (level === "B") return "bg-blue-100 text-blue-800";
    if (level === "C") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Índice de Confianza Inmobiliaria
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Valoraciones reales de clientes para elegir tu inmobiliaria con más información
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/valorar"
              className="px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Valorar inmobiliaria
            </Link>
          </div>
        </div>
      </section>

      {/* Búsqueda */}
      <section className="py-12 -mt-8">
        <div className="max-w-7xl mx-auto px-6">
          <HomeSearch />
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            ¿Cómo funciona el ICI?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Valorá tu experiencia
              </h3>
              <p className="text-gray-600">
                Compartí tu experiencia con una inmobiliaria de forma estructurada y anónima
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Calculamos el ICI
              </h3>
              <p className="text-gray-600">
                Usamos rating bayesiano y múltiples factores para un puntaje robusto y confiable
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Elegí con información
              </h3>
              <p className="text-gray-600">
                Consultá el ranking y el historial de valoraciones antes de decidir
              </p>
            </div>
          </div>

          <div className="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">
              📊 Más que un simple promedio
            </h4>
            <p className="text-sm text-blue-800">
              El ICI considera 6 dimensiones (acompañamiento, tiempo de respuesta, gestión, etc.), 
              aplica factores de verificación, recencia, estabilidad y consistencia. No es manipulable 
              con pocas valoraciones extremas gracias al rating bayesiano.
            </p>
          </div>
        </div>
      </section>

      {/* Ranking */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Ranking de Inmobiliarias
            </h2>
            <span className="text-gray-600">
              {agencies.length} {agencies.length === 1 ? "inmobiliaria" : "inmobiliarias"}
            </span>
          </div>

          {agencies.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-600 mb-4">
                Todavía no hay inmobiliarias valoradas
              </p>
              <Link
                href="/valorar"
                className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              >
                Sé el primero en valorar
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {agencies.map((agency, index) => (
                <Link
                  key={agency.id}
                  href={`/agencies/${agency.id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Posición */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-700">
                        {index + 1}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {agency.name}
                      </h3>
                      {(agency.city || agency.province) && (
                        <p className="text-sm text-gray-500">
                          {agency.city && `${agency.city}`}
                          {agency.province && `, ${agency.province}`}
                          {agency.neighborhood && ` - ${agency.neighborhood}`}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="text-gray-600">
                          {agency.totalReviews} {agency.totalReviews === 1 ? "valoración" : "valoraciones"}
                        </span>
                        {agency.verifiedCount > 0 && (
                          <span className="text-green-600">
                            ✓ {agency.verifiedCount} {agency.verifiedCount === 1 ? "verificada" : "verificadas"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ICI Score */}
                    <div className="flex-shrink-0 text-right">
                      <div className={`inline-block px-4 py-2 rounded-lg border-2 ${getICIColor(agency.ici)}`}>
                        <div className="text-3xl font-bold">
                          {agency.ici}
                        </div>
                        <div className="text-xs font-medium">/ 100</div>
                      </div>
                      <div className="mt-2">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getEvidenceColor(agency.evidenceLevel)}`}>
                          Nivel {agency.evidenceLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA final */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            ¿Tuviste una operación inmobiliaria?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Tu experiencia puede ayudar a otros a tomar mejores decisiones
          </p>
          <Link
            href="/valorar"
            className="inline-block px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Compartir mi experiencia
          </Link>
        </div>
      </section>
    </main>
  );
}
