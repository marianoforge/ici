"use client";

import { useState } from "react";
import { ReviewFormSchema, type ReviewForm, type ChecklistValue, type OperationType } from "@/schemas/review";
import { useRouter } from "next/navigation";
import { AgencyAutocomplete, type AgencySuggestion } from "./agency-autocomplete";

export function ReviewFormComponent() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedAgency, setSelectedAgency] = useState<AgencySuggestion | null>(null);
  const [isCreatingNewAgency, setIsCreatingNewAgency] = useState(false);
  
  const [formData, setFormData] = useState<ReviewForm>({
    agencyName: "",
    branchName: "",
    operationType: "BUY",
    province: "",
    city: "",
    neighborhood: "",
    overallRating: 3,
    feesClear: "NA",
    noHiddenCosts: "NA",
    metDeadlines: "NA",
    docsOnTime: "NA",
    professionalRespectful: "NA",
    goodCommunication: "NA",
    unduePressure: "NA",
    moneyWithheld: "NA",
    abusivePractices: "NA",
    accompanimentScore: 3,
    responseTimeScore: 3,
    problemResolutionScore: 3,
    npsScore: 5,
    comment: "",
    wantsVerification: false,
    documentUploaded: false,
  });

  const handleAgencySelect = (agency: AgencySuggestion | null) => {
    if (agency) {
      // Inmobiliaria existente seleccionada - auto-rellenar campos
      setSelectedAgency(agency);
      setIsCreatingNewAgency(false);
      setFormData({
        ...formData,
        agencyName: agency.name,
        province: agency.province || "",
        city: agency.city || "",
        neighborhood: agency.neighborhood || "",
      });
    } else {
      // "Crear nueva" seleccionado
      setSelectedAgency(null);
      setIsCreatingNewAgency(true);
      // Mantener el nombre escrito, limpiar los demás campos
      setFormData({
        ...formData,
        province: "",
        city: "",
        neighborhood: "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Validar con Zod
    const result = ReviewFormSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      if (result.error?.issues) {
        result.error.issues.forEach((err) => {
          const path = err.path.join(".");
          fieldErrors[path] = err.message;
        });
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      let agencyId = selectedAgency?.id;

      // Si está creando una nueva inmobiliaria, crearla primero
      if (isCreatingNewAgency && !selectedAgency) {
        const agencyResponse = await fetch("/api/agencies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.agencyName,
            province: formData.province,
            city: formData.city,
            neighborhood: formData.neighborhood,
          }),
        });

        if (!agencyResponse.ok) {
          const error = await agencyResponse.json();
          throw new Error(error.error || "Error al crear la inmobiliaria");
        }

        const agencyData = await agencyResponse.json();
        agencyId = agencyData.agency.id;
      }

      // Crear la review
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          agencyId, // Enviar el ID en lugar del nombre
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al enviar la valoración");
      }

      const data = await response.json();
      
      // Redirigir a la página de resultados
      router.push(`/agencies/${data.agencyId}`);
      
    } catch (error) {
      setErrors({
        _form: error instanceof Error ? error.message : "Error desconocido",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ChecklistField = ({
    label,
    name,
    value,
    onChange,
    error,
  }: {
    label: string;
    name: string;
    value: ChecklistValue;
    onChange: (value: ChecklistValue) => void;
    error?: string;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-3">
        {(["YES", "NO", "NA"] as const).map((option) => (
          <label key={option} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">
              {option === "YES" ? "Sí" : option === "NO" ? "No" : "N/A"}
            </span>
          </label>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );

  const RatingScaleField = ({
    label,
    description,
    name,
    value,
    onChange,
    min = 1,
    max = 5,
    lowLabel,
    highLabel,
    error,
  }: {
    label: string;
    description?: string;
    name: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    lowLabel?: string;
    highLabel?: string;
    error?: string;
  }) => {
    const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-1 sm:gap-2">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange(option)}
                className={`flex-1 py-2 px-1 sm:px-3 rounded-lg border-2 transition-all text-sm sm:text-base ${
                  value === option
                    ? "border-blue-600 bg-blue-50 text-blue-900 font-semibold"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          {(lowLabel || highLabel) && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>{lowLabel}</span>
              <span>{highLabel}</span>
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Valorar Inmobiliaria
        </h1>
        <p className="text-gray-600">
          Comparte tu experiencia para ayudar a otros a tomar mejores decisiones
        </p>
      </div>

      {errors._form && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{errors._form}</p>
        </div>
      )}

      {/* 1. Identificación */}
      <section className="space-y-4 p-6 bg-white rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          1. Identificación
        </h2>
        
        {/* Autocomplete de inmobiliaria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la inmobiliaria y sucursal *
          </label>
          <AgencyAutocomplete
            value={formData.agencyName}
            onChange={(value) => setFormData({ ...formData, agencyName: value })}
            onSelectAgency={handleAgencySelect}
            error={errors.agencyName}
          />
          {selectedAgency && (
            <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
              <span>✓</span> Inmobiliaria existente seleccionada
            </p>
          )}
          {isCreatingNewAgency && (
            <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
              <span>+</span> Se creará una nueva inmobiliaria
            </p>
          )}
        </div>

        {/* Ubicación */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provincia *
            </label>
            <input
              type="text"
              value={formData.province}
              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              disabled={selectedAgency !== null}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                selectedAgency !== null ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
              placeholder="Ej: Buenos Aires"
            />
            {errors.province && <p className="text-sm text-red-600 mt-1">{errors.province}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad *
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              disabled={selectedAgency !== null}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                selectedAgency !== null ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
              placeholder="Ej: CABA"
            />
            {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barrio (opcional)
            </label>
            <input
              type="text"
              value={formData.neighborhood}
              onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
              disabled={selectedAgency !== null}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                selectedAgency !== null ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
              placeholder="Ej: Palermo"
            />
          </div>
        </div>

        {/* Tipo de operación - movido al final */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de operación *
          </label>
          <select
            value={formData.operationType}
            onChange={(e) => setFormData({ ...formData, operationType: e.target.value as OperationType })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="BUY">Compra</option>
            <option value="SELL">Venta</option>
            <option value="RENT">Alquiler</option>
          </select>
        </div>
      </section>

      {/* 2. Puntaje general */}
      <section className="space-y-4 p-6 bg-white rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          2. Puntaje General
        </h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            ¿Cómo calificarías tu experiencia general? *
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setFormData({ ...formData, overallRating: rating })}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  formData.overallRating === rating
                    ? "border-blue-600 bg-blue-50 text-blue-900 font-semibold"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {rating} ⭐
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Evaluación estructurada */}
      <section className="space-y-6 p-6 bg-white rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          3. Evaluación Detallada
        </h2>

        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Transparencia</h3>
          <ChecklistField
            label="¿Los honorarios y costos fueron claros desde el inicio?"
            name="feesClear"
            value={formData.feesClear}
            onChange={(value) => setFormData({ ...formData, feesClear: value })}
          />
          <ChecklistField
            label="¿No hubo costos ocultos o sorpresas?"
            name="noHiddenCosts"
            value={formData.noHiddenCosts}
            onChange={(value) => setFormData({ ...formData, noHiddenCosts: value })}
          />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-medium text-gray-900">Cumplimiento</h3>
          <ChecklistField
            label="¿Cumplieron con los plazos acordados?"
            name="metDeadlines"
            value={formData.metDeadlines}
            onChange={(value) => setFormData({ ...formData, metDeadlines: value })}
          />
          <ChecklistField
            label="¿Entregaron la documentación a tiempo?"
            name="docsOnTime"
            value={formData.docsOnTime}
            onChange={(value) => setFormData({ ...formData, docsOnTime: value })}
          />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-medium text-gray-900">Trato</h3>
          <ChecklistField
            label="¿El trato fue profesional y respetuoso?"
            name="professionalRespectful"
            value={formData.professionalRespectful}
            onChange={(value) => setFormData({ ...formData, professionalRespectful: value })}
          />
          <ChecklistField
            label="¿La comunicación fue buena y fluida?"
            name="goodCommunication"
            value={formData.goodCommunication}
            onChange={(value) => setFormData({ ...formData, goodCommunication: value })}
          />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="font-medium text-red-900">Señales Negativas</h3>
          <ChecklistField
            label="¿Hubo presión indebida para cerrar la operación?"
            name="unduePressure"
            value={formData.unduePressure}
            onChange={(value) => setFormData({ ...formData, unduePressure: value })}
          />
          <ChecklistField
            label="¿Retuvieron dinero sin justificación?"
            name="moneyWithheld"
            value={formData.moneyWithheld}
            onChange={(value) => setFormData({ ...formData, moneyWithheld: value })}
          />
          <ChecklistField
            label="¿Hubo prácticas abusivas o engañosas?"
            name="abusivePractices"
            value={formData.abusivePractices}
            onChange={(value) => setFormData({ ...formData, abusivePractices: value })}
          />
        </div>
      </section>

      {/* 4. Experiencia de Servicio */}
      <section className="space-y-6 p-6 bg-white rounded-lg border border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            4. Experiencia de Servicio
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Evalúa aspectos clave de la atención recibida
          </p>
        </div>

        <RatingScaleField
          label="Acompañamiento y confianza"
          description="¿Qué tan acompañado/a y contenido/a te sentiste durante todo el proceso de la operación?"
          name="accompanimentScore"
          value={formData.accompanimentScore}
          onChange={(value) => setFormData({ ...formData, accompanimentScore: value })}
          lowLabel="Nada acompañado"
          highLabel="Muy acompañado"
          error={errors.accompanimentScore}
        />

        <RatingScaleField
          label="Tiempo de respuesta"
          description="Desde que te comunicaste con la inmobiliaria, ¿qué tan rápida fue su respuesta?"
          name="responseTimeScore"
          value={formData.responseTimeScore}
          onChange={(value) => setFormData({ ...formData, responseTimeScore: value })}
          lowLabel="Muy lento"
          highLabel="Muy rápido"
          error={errors.responseTimeScore}
        />

        <RatingScaleField
          label="Gestión y resolución de situaciones"
          description="Ante dudas, imprevistos o conflictos, ¿qué tan eficaz fue la inmobiliaria para resolverlos?"
          name="problemResolutionScore"
          value={formData.problemResolutionScore}
          onChange={(value) => setFormData({ ...formData, problemResolutionScore: value })}
          lowLabel="Nada eficaz"
          highLabel="Muy eficaz"
          error={errors.problemResolutionScore}
        />
      </section>

      {/* 5. Comentario */}
      <section className="space-y-4 p-6 bg-white rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          5. Comentario
        </h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cuéntanos tu experiencia * (mínimo 50 caracteres)
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe tu experiencia con esta inmobiliaria..."
          />
          <div className="flex justify-between items-center mt-1">
            {errors.comment && <p className="text-sm text-red-600">{errors.comment}</p>}
            <p className="text-sm text-gray-500 ml-auto">
              {formData.comment.length} / 50 caracteres mínimos
            </p>
          </div>
        </div>
      </section>

      {/* 6. Recomendación (NPS) */}
      <section className="space-y-4 p-6 bg-white rounded-lg border border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            6. Recomendación
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Tu opinión general sobre la inmobiliaria
          </p>
        </div>

        <RatingScaleField
          label="¿Qué tan probable es que recomiendes esta inmobiliaria?"
          name="npsScore"
          value={formData.npsScore}
          onChange={(value) => setFormData({ ...formData, npsScore: value })}
          min={1}
          max={10}
          lowLabel="Nada probable"
          highLabel="Muy probable"
          error={errors.npsScore}
        />

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <span className="font-medium">Guía:</span> 1-6 = No lo recomendaría, 7-8 = Neutral, 9-10 = Lo recomiendo
        </div>
      </section>

      {/* 7. Verificación */}
      <section className="space-y-4 p-6 bg-white rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          7. Verificación (Opcional)
        </h2>
        <p className="text-sm text-gray-600">
          Las valoraciones verificadas tienen más peso en el cálculo del ICI
        </p>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.wantsVerification}
            onChange={(e) => setFormData({ ...formData, wantsVerification: e.target.checked })}
            className="w-5 h-5 text-blue-600 rounded"
          />
          <span className="text-sm font-medium text-gray-700">
            Quiero verificar mi operación
          </span>
        </label>

        {formData.wantsVerification && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.documentUploaded}
              onChange={(e) => setFormData({ ...formData, documentUploaded: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              He subido la documentación
            </span>
          </label>
        )}
      </section>

      {/* Submit */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Enviando..." : "Enviar Valoración"}
        </button>
      </div>
    </form>
  );
}

