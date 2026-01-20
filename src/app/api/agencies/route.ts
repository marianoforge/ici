import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

/**
 * Schema para crear una nueva inmobiliaria
 */
const CreateAgencySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  branchName: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
});

/**
 * POST /api/agencies
 * 
 * Crea una nueva inmobiliaria
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = CreateAgencySchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }
    
    const data = validationResult.data;
    
    // Verificar si ya existe una inmobiliaria con el mismo nombre exacto
    const existing = await prisma.agency.findFirst({
      where: {
        name: {
          equals: data.name,
          mode: "insensitive",
        },
      },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una inmobiliaria con ese nombre" },
        { status: 409 }
      );
    }
    
    // Crear la inmobiliaria
    const agency = await prisma.agency.create({
      data: {
        name: data.name,
        province: data.province,
        city: data.city,
        neighborhood: data.neighborhood,
      },
    });
    
    return NextResponse.json(
      {
        success: true,
        agency: {
          id: agency.id,
          name: agency.name,
          province: agency.province,
          city: agency.city,
          neighborhood: agency.neighborhood,
        },
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Error creating agency:", error);
    
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
