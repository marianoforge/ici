# 📊 Índice de Confianza Inmobiliaria (ICI)

Sistema de valoración y confianza para inmobiliarias basado en experiencias reales.

## 🚀 Inicio Rápido

### Requisitos

- Node.js 18+
- Docker (para PostgreSQL)
- Yarn

### Instalación

```bash
# Instalar dependencias
yarn install

# Levantar base de datos
docker compose up -d

# Ejecutar migraciones
npx prisma migrate dev

# Generar Prisma Client
npx prisma generate

# Iniciar servidor de desarrollo
yarn dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 🎯 Características

### ✅ Implementado

- **Formulario de valoración completo**
  - Identificación de inmobiliaria y operación
  - Puntaje general (1-5 estrellas)
  - Evaluación estructurada (checklist)
  - Comentarios detallados
  - Verificación opcional

- **Cálculo robusto del ICI**
  - Rating bayesiano (no es un simple promedio)
  - Factores de verificación, recencia y estabilidad
  - Penalizaciones por incidentes graves
  - Nivel de evidencia (A/B/C/D)

- **Event Sourcing**
  - Canonical JSON + SHA-256
  - Cadena de hashes inmutable
  - Proyecciones para queries rápidas

- **UI Moderna**
  - Diseño limpio y accesible
  - Responsive
  - Tailwind CSS

## 📐 Cómo funciona el ICI

El ICI no es un simple promedio de estrellas. Utiliza:

1. **Rating Bayesiano**: Considera la cantidad de reseñas para evitar que pocas valoraciones extremas distorsionen el puntaje
2. **Factores multiplicadores**:
   - Verificación: +15% si hay documentación
   - Recencia: Más peso a valoraciones recientes
   - Estabilidad: Penaliza variabilidad extrema
3. **Penalizaciones**: Incidentes graves reducen el puntaje
4. **Nivel de evidencia**: Indica qué tan confiable es el puntaje

### Fórmula

```
BayesRating = (n/(n+m))*R + (m/(n+m))*C

Donde:
- n = cantidad de reseñas
- m = prior (20)
- R = promedio interno
- C = promedio del mercado (3.8)

ICI = InternalScore × Factores - Penalizaciones
Rango: 0-100
```

## 🗂️ Estructura del Proyecto

```
src/
├── app/
│   ├── api/
│   │   ├── reviews/route.ts          # POST/GET reviews
│   │   └── agencies/[id]/score/      # GET ICI score
│   ├── agencies/[id]/page.tsx        # Vista de agencia
│   └── page.tsx                      # Formulario principal
├── components/
│   └── review-form.tsx               # Formulario de valoración
├── lib/
│   ├── canonical-json.ts             # Canonicalización
│   ├── hash.ts                       # SHA-256
│   ├── prisma.ts                     # Singleton de Prisma
│   ├── review-derived.ts             # Campos calculados
│   └── scoring/
│       └── agency-score.ts           # Cálculo del ICI
└── schemas/
    └── review.ts                     # Validación con Zod
```

## 🔐 Seguridad y Trazabilidad

Cada valoración:
1. Se canonicaliza a JSON determinístico
2. Se genera un hash SHA-256
3. Se encadena con el hash anterior
4. Se guarda como evento inmutable

Esto permite:
- Verificar integridad de los datos
- Auditar cambios
- Prevenir manipulación

## 📊 Base de Datos

### Modelos principales

- **Agency**: Inmobiliarias
- **ReviewEvent**: Eventos inmutables (event sourcing)
- **ReviewProjection**: Vista materializada para queries

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
yarn test
```

## 📝 Próximos pasos

- [ ] Búsqueda de inmobiliarias
- [ ] Ranking de inmobiliarias
- [ ] Upload de documentos para verificación
- [ ] Moderación de contenido
- [ ] API pública
- [ ] Tests unitarios y de integración
- [ ] Firma digital de eventos (KMS)

## 🤝 Contribuir

Este es un POC. Las contribuciones son bienvenidas.

## 📄 Licencia

MIT
