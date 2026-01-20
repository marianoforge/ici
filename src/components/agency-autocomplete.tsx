"use client";

import { useState, useEffect, useRef } from "react";

export interface AgencySuggestion {
  id: string;
  name: string;
  province?: string | null;
  city?: string | null;
  neighborhood?: string | null;
}

interface AgencyAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectAgency: (agency: AgencySuggestion | null) => void;
  error?: string;
}

export function AgencyAutocomplete({
  value,
  onChange,
  onSelectAgency,
  error,
}: AgencyAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AgencySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCreateOption, setShowCreateOption] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Buscar inmobiliarias con debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.length < 2) {
      setSuggestions([]);
      setShowCreateOption(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      
      try {
        const response = await fetch(`/api/agencies/search?q=${encodeURIComponent(value)}`);
        const data = await response.json();
        
        setSuggestions(data.agencies || []);
        setShowCreateOption(data.agencies?.length === 0);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error searching agencies:", error);
        setSuggestions([]);
        setShowCreateOption(true);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value]);

  const handleSelectAgency = (agency: AgencySuggestion) => {
    onChange(agency.name);
    onSelectAgency(agency);
    setShowSuggestions(false);
  };

  const handleCreateNew = () => {
    onSelectAgency(null); // null significa "crear nueva"
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (value.length >= 2 && (suggestions.length > 0 || showCreateOption)) {
            setShowSuggestions(true);
          }
        }}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Ej: Remax Buró"
        autoComplete="off"
      />
      
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

      {/* Dropdown de sugerencias */}
      {showSuggestions && (suggestions.length > 0 || showCreateOption) && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-3 text-sm text-gray-500">
              Buscando...
            </div>
          )}
          
          {!isLoading && suggestions.length > 0 && (
            <>
              {suggestions.map((agency) => (
                <button
                  key={agency.id}
                  type="button"
                  onClick={() => handleSelectAgency(agency)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{agency.name}</div>
                  {(agency.city || agency.province) && (
                    <div className="text-xs text-gray-500">
                      {agency.city && `${agency.city}`}
                      {agency.province && `, ${agency.province}`}
                    </div>
                  )}
                </button>
              ))}
            </>
          )}
          
          {!isLoading && showCreateOption && (
            <button
              type="button"
              onClick={handleCreateNew}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-t-2 border-gray-200"
            >
              <div className="flex items-center gap-2 text-blue-600 font-medium">
                <span className="text-xl">+</span>
                <span>No encontrada - Crear nueva inmobiliaria</span>
              </div>
              <div className="text-xs text-gray-500 ml-7">
                "{value}"
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
