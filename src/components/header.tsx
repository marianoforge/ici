import Link from "next/link";

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">ICI</span>
            <span className="text-sm text-gray-600 hidden sm:inline">
              Índice de Confianza Inmobiliaria
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Ranking
            </Link>
            <Link
              href="/valorar"
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Valorar
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
