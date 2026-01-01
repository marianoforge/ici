# 📊 Índice de Confianza Inmobiliaria (ICI) — POC

Este repositorio implementa un **Proof of Concept (POC)** del Índice de Confianza Inmobiliaria, enfocado exclusivamente en:

- Formulario de valoración de inmobiliarias
- Normalización de datos
- Cálculo del índice de confianza (0–100)
- Manejo correcto de pocas reseñas (1–3)
- Nivel de evidencia / confianza del puntaje

No es un promedio simple de estrellas.

---

## 🎯 Objetivo del POC

Construir un sistema que permita:

1. Que una persona cargue una valoración sobre una inmobiliaria.
2. Transformar esa información en datos estructurados.
3. Calcular un puntaje **robusto y defendible**, incluso con pocas reseñas.
4. Mostrar siempre **puntaje + nivel de confianza**.

---

## 🧱 Stack técnico

- Next.js (App Router)
- TypeScript
- Prisma + PostgreSQL
- Zod (validación del formulario)
- `src/` directory
- Import alias `@/*`
- ESLint
- React Compiler: NO

---

## 📁 Estructura mínima del POC

```
src/
  app/
    api/
      reviews/
        route.ts          # POST del formulario
  schemas/
    review.ts             # Zod schema del form
  lib/
    canonical-json.ts     # Canonicalización
    hash.ts               # SHA-256
    review-derived.ts     # Campos derivados
    scoring/
      agency-score.ts     # Cálculo del ICI
```

---

## 🧾 Formulario de valoración (POC)

### Datos que carga el usuario

#### 1. Identificación
- Nombre de la inmobiliaria
- Tipo de operación: BUY | SELL | RENT
- Zona:
  - Provincia
  - Ciudad
  - Barrio (opcional)

#### 2. Puntaje general
- `overallRating`: entero **1 a 5**

#### 3. Evaluación estructurada (checklist)

Valores posibles:
- `YES`
- `NO`
- `NA`

**Transparencia**
- feesClear
- noHiddenCosts

**Cumplimiento**
- metDeadlines
- docsOnTime

**Trato**
- professionalRespectful
- goodCommunication

**Señales negativas**
- unduePressure
- moneyWithheld
- abusivePractices

#### 4. Comentario
- Texto libre (mínimo sugerido: 50 caracteres)

#### 5. Verificación (opcional)
- wantsVerification
- documentUploaded

---

## 🔢 Cómo se calculan los datos

### Checklist → números

- YES → 1
- NO → 0
- NA → se ignora

Se calculan sub-índices entre 0 y 1:
- Transparencia
- Cumplimiento
- Trato

Y un promedio general:
`positivesOverallScore`

---

### Señales negativas → severityPoints

| Señal | Puntos |
|------|--------|
| unduePressure | +2 |
| abusivePractices | +4 |
| moneyWithheld | +6 |

---

### Verificación

Si `wantsVerification === true` y `documentUploaded === true`:

- `isVerifiedOperation = true`
- Aumenta el peso del score
- Aumenta la evidencia

---

## 📐 Índice de Confianza Inmobiliaria (ICI)

### Rating bayesiano

```
BayesRating = (n/(n+m))*R + (m/(n+m))*C
```

- R: promedio interno
- n: cantidad de reseñas
- C: promedio del mercado (ej: 3.8)
- m: prior (20)

Se normaliza a 0–100.

---

### Factores

- VerifyFactor
- RecencyFactor
- StabilityFactor

---

### Penalizaciones

- Incidentes severos (severityPoints)
- Fraude (POC: 0)

---

### Resultado final

```
ICI = InternalScore - IncidentPenalty
```

Rango: **0 a 100**

---

## 📊 Evidencia (confianza del puntaje)

```
n_eff = n + 2 * verifiedCount
Evidence = 1 - exp(-n_eff / 15)
```

### Niveles
- A: Alta
- B: Media
- C: Baja
- D: Muy baja

Para ranking:
```
ICI_adj = ICI * (0.75 + 0.25 * Evidence)
```

---

## 🔐 Canonical JSON + Hash

Cada valoración:
1. Se canonicaliza el JSON
2. Se genera un hash SHA-256
3. Se guarda como evento inmutable

---

## 🚀 Endpoint principal

### POST /api/reviews

Flujo:
1. Validar payload (Zod)
2. Canonicalizar JSON
3. Generar hash
4. Guardar evento
5. Guardar proyección
6. Responder:
```
{
  reviewId,
  eventHash
}
```

---

## 🧠 Principio del proyecto

**No certificamos inmobiliarias.  
Medimos confianza con datos reales y comparables.**
