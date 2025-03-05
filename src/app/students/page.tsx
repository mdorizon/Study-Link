import { Suspense } from 'react';
import StudentList from '@/components/app/students/StudentList';
import { getStudents } from '@/services/student.service';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default async function StudentsPage() {
  try {
    const studentsData = await getStudents();

    const students = studentsData.map((student) => {
      // Convertir les compétences en tableau
      const skillsArray = student.skills.split(',').map((s) => ({ id: s.trim(), name: s.trim() }));

      // Déterminer le statut en fonction des compétences
      let status: 'Alternant' | 'Stagiaire' = 'Stagiaire'; // Par défaut

      // Si l'étudiant a des compétences liées à l'alternance, il est alternant
      const alternanceKeywords = ['alternance', 'apprentissage', 'alternant', 'apprenti'];
      if (
        skillsArray.some((skill) =>
          alternanceKeywords.some((keyword) => skill.name.toLowerCase().includes(keyword)),
        )
      ) {
        status = 'Alternant';
      }

      return {
        id: student.id,
        firstName: student.user?.firstname || '',
        lastName: student.user?.lastname || '',
        photoUrl: student.user?.profilePictureId
          ? `/api/files/${student.user.profilePictureId}`
          : '',
        status,
        school: student.school?.name || '',
        skills: skillsArray,
      };
    });

    if (students.length === 0) {
      return (
        <main className="container mx-auto px-4 py-8">
          <ErrorMessage
            title="Aucun étudiant trouvé"
            message="Il n'y a pas d'étudiants disponibles pour le moment."
          />
        </main>
      );
    }

    return (
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<LoadingSpinner />}>
          <StudentList students={students} title="Découvrez nos étudiants" />
        </Suspense>
      </main>
    );
  } catch (error) {
    console.error('Erreur lors du chargement des étudiants:', error);
    return (
      <main className="container mx-auto px-4 py-8">
        <ErrorMessage
          title="Erreur de chargement"
          message="Une erreur est survenue lors du chargement des étudiants. Veuillez réessayer plus tard."
        />
      </main>
    );
  }
}
