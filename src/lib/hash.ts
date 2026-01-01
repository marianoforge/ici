/**
 * Genera un hash SHA-256 de un string
 * 
 * Usa la Web Crypto API disponible en Node.js y navegadores modernos
 */
export async function sha256(message: string): Promise<string> {
  // Convertir el string a bytes
  const msgBuffer = new TextEncoder().encode(message);
  
  // Generar el hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  
  // Convertir el hash a hexadecimal
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  
  return hashHex;
}

/**
 * Genera un hash de un objeto usando canonical JSON
 */
export async function hashObject(obj: unknown): Promise<string> {
  const { canonicalJSON } = await import("./canonical-json");
  const canonical = canonicalJSON(obj);
  return sha256(canonical);
}

