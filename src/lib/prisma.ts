import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

/**
 * Singleton de PrismaClient para evitar múltiples instancias en desarrollo
 * 
 * En desarrollo, Next.js hace hot-reload y puede crear múltiples instancias
 * Este patrón previene ese problema
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: pg.Pool | undefined;
};

// Crear pool de conexiones de PostgreSQL
const pool =
  globalForPrisma.pool ??
  new pg.Pool({
    connectionString: process.env.DATABASE_URL,
  });

// Crear adapter de Prisma
const adapter = new PrismaPg(pool);

// Crear cliente de Prisma con el adapter
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

