import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasDatabase: !!process.env.DATABASE_URL,
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    hasPostgresPrisma: !!process.env.POSTGRES_PRISMA_URL,
    databasePrefix: process.env.DATABASE_URL?.substring(0, 30),
    postgresPrefix: process.env.POSTGRES_URL?.substring(0, 30),
    postgresPrismaPrefix: process.env.POSTGRES_PRISMA_URL?.substring(0, 30),
    nodeEnv: process.env.NODE_ENV,
  });
}

