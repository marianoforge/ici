/**
 * Canonicaliza un objeto JavaScript a JSON determinístico
 * 
 * Reglas:
 * - Claves ordenadas alfabéticamente
 * - Sin espacios en blanco
 * - Formato consistente
 * 
 * Esto garantiza que el mismo objeto siempre produzca el mismo hash
 */
export function canonicalJSON(obj: unknown): string {
  if (obj === null) {
    return "null";
  }

  if (obj === undefined) {
    return "null";
  }

  if (typeof obj === "boolean" || typeof obj === "number") {
    return String(obj);
  }

  if (typeof obj === "string") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const items = obj.map((item) => canonicalJSON(item));
    return `[${items.join(",")}]`;
  }

  if (typeof obj === "object") {
    const keys = Object.keys(obj).sort();
    const pairs = keys.map((key) => {
      const value = (obj as Record<string, unknown>)[key];
      return `${JSON.stringify(key)}:${canonicalJSON(value)}`;
    });
    return `{${pairs.join(",")}}`;
  }

  return "null";
}

