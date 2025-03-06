import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { UpdateUserDTO, UserByIdResponseDTO, UserResponseDTO } from '@/dto/user.dto';
import { validateUserUpdate, ValidationError } from '@/utils/validation/user.validation';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<UserByIdResponseDTO | { error: string }>> {
  try {
    const id = (await params).id;

    const user = await prisma.user.findUnique({
      where: {
        id: id,
        deletedAt: null,
      },
      include: {
        student: {
          include: {
            school: true,
            curriculumVitae: true,
            jobRequests: {
              where: { deletedAt: null },
              include: {
                job: {
                  include: {
                    company: {
                      include: {
                        logo: true,
                      },
                    },
                    featuredImage: true,
                  },
                },
              },
            },
            recommendations: true,
          },
        },
        schoolOwner: {
          include: {
            school: {
              include: {
                domain: true,
                logo: true,
              },
            },
          },
        },
        companyOwner: {
          include: {
            company: {
              include: {
                logo: true,
                jobs: {
                  where: { deletedAt: null },
                },
              },
            },
          },
        },
        admin: true,
        profilePicture: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json(user as UserByIdResponseDTO);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'utilisateur" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<UserResponseDTO | { error: string; details?: ValidationError[] }>> {
  try {
    const userId = (await params).id;
    const body = (await request.json()) as UpdateUserDTO;

    const validationResult = await validateUserUpdate(body, userId);
    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          details: validationResult.errors,
        },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.email && { email: body.email.toLowerCase() }),
        ...(body.firstname && { firstname: body.firstname }),
        ...(body.lastname && { lastname: body.lastname }),
        ...(body.profilePictureId !== undefined && { profilePictureId: body.profilePictureId }),
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'utilisateur" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<{ message: string } | { error: string }>> {
  try {
    const id = (await params).id;

    const existingUser = await prisma.user.findUnique({
      where: { id: id },
      include: {
        student: true,
        schoolOwner: true,
        companyOwner: true,
        admin: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Transaction is used to cascade values
    // Used here to delete all information related to the user
    // If one transaction fail, other tx are not executed and a rollback is executed
    await prisma.$transaction(async (tx) => {
      if (existingUser.student) {
        await tx.recommendation.deleteMany({
          where: {
            OR: [
              { studentId: existingUser.student.id },
              { primaryForStudent: { id: existingUser.student.id } },
            ],
          },
        });

        await tx.jobRequest.deleteMany({
          where: { studentId: existingUser.student.id },
        });

        await tx.student.delete({
          where: { id: existingUser.student.id },
        });
      }

      if (existingUser.schoolOwner) {
        await tx.schoolOwner.delete({
          where: { id: existingUser.schoolOwner.id },
        });
      }

      if (existingUser.companyOwner) {
        await tx.companyOwner.delete({
          where: { id: existingUser.companyOwner.id },
        });
      }

      if (existingUser.admin) {
        await tx.admin.delete({
          where: { id: existingUser.admin.id },
        });
      }

      await tx.verificationToken.deleteMany({
        where: { identifier: existingUser.email },
      });

      await tx.user.update({
        where: { id: id },
        data: {
          deletedAt: new Date(),
        },
      });
    });

    return NextResponse.json({
      message: 'Compte utilisateur et toutes les données associées supprimés avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du compte utilisateur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du compte utilisateur' },
      { status: 500 },
    );
  }
}
