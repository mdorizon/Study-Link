'use client';

import { Plus } from 'lucide-react';

import { useState } from 'react';

import { NewSchoolForm } from '@/components/admin/schools/NewSchoolForm';
import { SchoolList } from '@/components/admin/schools/SchoolList';
import { Button } from '@/components/ui/button';

export default function SchoolsPage() {
  const [isAddingSchool, setIsAddingSchool] = useState(false);
  const [isEditingSchool, setIsEditingSchool] = useState(false);

  return (
    <div className="space-y-6">
      {!isAddingSchool && !isEditingSchool && (
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des écoles</h1>
          <Button onClick={() => setIsAddingSchool(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une école
          </Button>
        </div>
      )}

      {isAddingSchool ? (
        <div>
          <NewSchoolForm
            onSuccess={() => setIsAddingSchool(false)}
            onCancel={() => setIsAddingSchool(false)}
          />
        </div>
      ) : (
        <SchoolList
          onEdit={() => setIsEditingSchool(true)}
          onEditEnd={() => setIsEditingSchool(false)}
        />
      )}
    </div>
  );
}
