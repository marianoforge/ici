"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AgencyResult {
  id: string;
  name: string;
  province?: string | null;
  city?: string | null;
}

export function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [results, setResults] = useState<AgencyResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Búsqueda con debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.length < 2 && !country && !province && !city) {
      setResults([]);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.append("q", query);
        if (country) params.append("country", country);
        if (province) params.append("province", province);
        if (city) params.append("city", city);

        const response = await fetch(`/api/agencies/search?${params.toString()}`);
        const data = await response.json();
        setResults(data.agencies || []);
        setShowResults(true);
      } catch (error) {
        console.error("Error searching:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, country, province, city]);

  const handleSelect = (agencyId: string) => {
    router.push(`/agencies/${agencyId}`);
  };

  return (
    <div ref={wrapperRef} className="relative max-w-3xl mx-auto">
      {/* Búsqueda principal */}
      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if ((query.length >= 2 || country || province || city) && results.length > 0) {
              setShowResults(true);
            }
          }}
          placeholder="Buscá una inmobiliaria... Ej: Remax Buró"
          className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          autoComplete="off"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
          {isLoading ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Filtros de ubicación */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="País"
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          autoComplete="off"
        />
        <input
          type="text"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          placeholder="Provincia"
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          autoComplete="off"
        />
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Localidad/Ciudad"
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          autoComplete="off"
        />
      </div>

      {/* Dropdown de resultados */}
      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto">
          {results.map((agency) => (
            <button
              key={agency.id}
              type="button"
              onClick={() => handleSelect(agency.id)}
              className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="font-semibold text-gray-900">{agency.name}</div>
              {(agency.city || agency.province) && (
                <div className="text-sm text-gray-500 mt-1">
                  {agency.city && `${agency.city}`}
                  {agency.province && `, ${agency.province}`}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {showResults && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-6 text-center">
          <p className="text-gray-600 mb-3">No encontramos esa inmobiliaria</p>
          <Link
            href="/valorar"
            className="inline-block px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            Valorar de todas formas
          </Link>
        </div>
      )}
    </div>
  );
}
