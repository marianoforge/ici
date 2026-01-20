import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/agencies/search?q=...
 * 
 * Busca inmobiliarias por nombre (fuzzy search)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    
    if (!query || query.length < 2) {
      return NextResponse.json({ agencies: [] });
    }
    
    // Buscar inmobiliarias que contengan el texto (case insensitive)
    const agencies = await prisma.agency.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        province: true,
        city: true,
        neighborhood: true,
      },
      take: 10, // Límite de resultados
      orderBy: {
        name: "asc",
      },
    });
    
    return NextResponse.json({ agencies });
    
  } catch (error) {
    console.error("Error searching agencies:", error);
    
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
