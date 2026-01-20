import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-3">ICI</h3>
            <p className="text-sm">
              Sistema de valoración y confianza para inmobiliarias basado en experiencias reales.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Enlaces</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white">
                  Ranking
                </Link>
              </li>
              <li>
                <Link href="/valorar" className="hover:text-white">
                  Valorar inmobiliaria
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Metodología</h4>
            <p className="text-sm">
              El ICI utiliza rating bayesiano, factores de verificación, recencia, 
              estabilidad y consistencia para calcular un puntaje robusto.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 text-sm text-center">
          <p>© {new Date().getFullYear()} ICI - Todos los derechos reservados</p>
        </div>
      </div>
    </footer>
  );
}
