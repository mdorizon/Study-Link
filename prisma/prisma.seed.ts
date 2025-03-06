import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🗑️  Nettoyage de la base de données...');
    await prisma.jobRequest.deleteMany();
    await prisma.job.deleteMany();
    await prisma.recommendation.deleteMany();
    await prisma.student.deleteMany();
    await prisma.companyOwner.deleteMany();
    await prisma.schoolOwner.deleteMany();
    await prisma.company.deleteMany();
    await prisma.school.deleteMany();
    await prisma.authorizedSchoolDomain.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.user.deleteMany();

    console.log('🌱 Début du seeding...');

    console.log("📚 Création du domaine de l'école...");
    const schoolDomain = await prisma.authorizedSchoolDomain.create({
      data: {
        domain: 'ecole-test.fr',
      },
    });

    console.log("🏫 Création de l'école...");
    const school = await prisma.school.create({
      data: {
        name: 'École Test',
        domain: {
          connect: {
            id: schoolDomain.id,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    });

    console.log("🏢 Création de l'entreprise...");
    const company = await prisma.company.create({
      data: {
        name: 'Entreprise Test',
        // siret: '12345678901234', // TODO: Add siret
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    });

    console.log("👨‍💼Création de l'administrateur...");
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        firstname: 'Admin',
        lastname: 'Test',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        admin: {
          create: {},
        },
      },
    });

    console.log("👨‍🏫Création du propriétaire de l'école...");
    const schoolOwnerUser = await prisma.user.create({
      data: {
        email: 'school-owner@ecole-test.fr',
        firstname: 'Directeur',
        lastname: 'École',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        schoolOwner: {
          create: {
            school: {
              connect: {
                id: school.id,
              },
            },
          },
        },
      },
    });

    console.log("👨‍💼Création du propriétaire de l'entreprise...");
    const companyOwnerUser = await prisma.user.create({
      data: {
        email: 'company-owner@entreprise-test.fr',
        firstname: 'Manager',
        lastname: 'Entreprise',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        companyOwner: {
          create: {
            company: {
              connect: {
                id: company.id,
              },
            },
          },
        },
      },
    });

    console.log("👨‍🎓Création de l'étudiant...");
    const studentUser = await prisma.user.create({
      data: {
        email: 'student@test.com',
        firstname: 'Étudiant',
        lastname: 'Test',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    });

    console.log('📝 Création du profil étudiant...');
    const student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        schoolId: school.id,
        studentEmail: 'student@ecole-test.fr',
        status: 'ACTIVE',
        skills: 'JavaScript, React, Node.js, TypeScript, Next.js, TailwindCSS, PostgreSQL',
        apprenticeshipRythm: '3 semaines entreprise / 1 semaine école',
        description:
          "Étudiant motivé en recherche d'alternance dans le développement web. Passionné par les nouvelles technologies et le développement full stack.",
        previousCompanies:
          'Stage de 6 mois chez Company X en tant que développeur frontend, Stage de 3 mois chez StartupY en tant que développeur full stack',
        availability: true,
      },
    });

    console.log("💼 Création d'une offre d'emploi...");
    const job = await prisma.job.create({
      data: {
        company: {
          connect: {
            id: company.id,
          },
        },
        name: 'Développeur Full Stack Next.js',
        description:
          "Nous recherchons un développeur full stack passionné pour un contrat d'alternance de 12 mois. Vous travaillerez sur des projets innovants utilisant les dernières technologies web.",
        skills: 'React, Next.js, Node.js, TypeScript, PostgreSQL, TailwindCSS, Git',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    });

    console.log("📨 Création d'une demande d'emploi...");
    await prisma.jobRequest.create({
      data: {
        student: {
          connect: {
            id: student.id,
          },
        },
        job: {
          connect: {
            id: job.id,
          },
        },
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    });

    console.log("👍 Création d'une recommandation...");
    const recommendation = await prisma.recommendation.create({
      data: {
        student: {
          connect: {
            id: student.id,
          },
        },
        company: {
          connect: {
            id: company.id,
          },
        },
        recommendation:
          "Excellent stagiaire, très motivé et compétent. A fait preuve d'une grande autonomie et d'une excellente capacité d'apprentissage. Maîtrise parfaitement les technologies front-end et back-end. A su s'intégrer rapidement dans l'équipe et proposer des solutions innovantes.",
      },
    });

    console.log("🔑 Création d'un token de vérification...");
    await prisma.verificationToken.create({
      data: {
        identifier: studentUser.email,
        token: 'verification_token_123',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expire dans 24h
      },
    });

    console.log('✅ Mise à jour de la recommandation primaire...');
    await prisma.student.update({
      where: {
        id: student.id,
      },
      data: {
        primaryRecommendationId: recommendation.id,
      },
    });

    console.log('✨ Seeding terminé avec succès !');
  } catch (error) {
    console.error('❌ Erreur pendant le seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
