import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/agencies/search?q=...&country=...&province=...&city=...
 * 
 * Busca inmobiliarias por nombre y filtros de ubicación
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const country = searchParams.get("country");
    const province = searchParams.get("province");
    const city = searchParams.get("city");
    
    // Si no hay ningún filtro, retornar vacío
    if ((!query || query.length < 2) && !country && !province && !city) {
      return NextResponse.json({ agencies: [] });
    }
    
    // Construir filtros dinámicos
    const where: any = {
      AND: []
    };
    
    // Filtro por nombre
    if (query && query.length >= 2) {
      where.AND.push({
        name: {
          contains: query,
          mode: "insensitive",
        },
      });
    }
    
    // Filtros de ubicación
    // TODO: Descomentar cuando se aplique la migración add_country_to_agency
    // if (country) {
    //   where.AND.push({
    //     country: {
    //       contains: country,
    //       mode: "insensitive",
    //     },
    //   });
    // }
    
    if (province) {
      where.AND.push({
        province: {
          contains: province,
          mode: "insensitive",
        },
      });
    }
    
    if (city) {
      where.AND.push({
        city: {
          contains: city,
          mode: "insensitive",
        },
      });
    }
    
    // Si no hay filtros AND, usar objeto vacío
    const finalWhere = where.AND.length > 0 ? where : {};
    
    // Buscar inmobiliarias
    const agencies = await prisma.agency.findMany({
      where: finalWhere,
      select: {
        id: true,
        name: true,
        province: true,
        city: true,
        neighborhood: true,
      },
      take: 20, // Aumentar límite para más resultados con filtros
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
