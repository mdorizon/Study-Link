import { PrismaClient } from '@prisma/client';

import { NextResponse } from 'next/server';

import { validateSchoolData } from '@/utils/validation/school.validation';

import { SchoolResponseDTO, UpdateSchoolDTO } from '@/dto/school.dto';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<SchoolResponseDTO | { error: string }>> {
  try {
    const id = (await params).id;
    const school = await prisma.school.findUnique({
      where: {
        id: id,
        deletedAt: null,
      },
      include: {
        domain: true,
      },
    });

    if (!school) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 });
    }

    return NextResponse.json(school);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'école:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'école" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<SchoolResponseDTO | { error: string; details?: Record<string, string> }>> {
  try {
    const id = (await params).id;
    const body = (await request.json()) as UpdateSchoolDTO;

    const validationResult = await validateSchoolData(body);
    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          details: validationResult.errors,
        },
        { status: 400 },
      );
    }

    const school = await prisma.school.update({
      where: {
        id: id,
        deletedAt: null,
      },
      data: {
        name: body.name,
        domainId: body.domainId,
        logo: body.logo,
      },
      include: {
        domain: true,
      },
    });

    return NextResponse.json(school);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'école:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'école" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<{ success: boolean } | { error: string }>> {
  try {
    const id = (await params).id;
    const existingSchool = await prisma.school.findUnique({
      where: { id },
    });

    if (!existingSchool) {
      return NextResponse.json({ error: 'École non trouvée' }, { status: 404 });
    }

    await prisma.school.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'école:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'école" },
      { status: 500 },
    );
  }
}
