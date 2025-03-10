import type { School as PrismaSchool } from '@prisma/client';

import Image from 'next/image';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { handleUploadFile } from '@/services/uploadFile';

type School = PrismaSchool & { isActive: boolean };

interface FormData {
  name: string;
  logo: File | null;
}

interface FormErrors {
  name?: string;
  logo?: string;
}

interface EditSchoolFormProps {
  school: School;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditSchoolForm({ school, onSuccess, onCancel }: EditSchoolFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: school.name,
    logo: null,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(school.logo);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      setFormData((prev) => ({ ...prev, logo: null }));
      setLogoUrl(null);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      setFormErrors((prev) => ({
        ...prev,
        logo: 'Type de fichier non supporté. Types acceptés : jpg, jpeg, png, gif, webp',
      }));
      e.target.value = '';
      return;
    }

    try {
      setFormData((prev) => ({ ...prev, logo: file }));
      setFormErrors((prev) => ({ ...prev, logo: undefined }));

      const result = await handleUploadFile(e, 'studylink_images');

      if (result.error) {
        setFormErrors((prev) => ({
          ...prev,
          logo: result.error,
        }));
        e.target.value = '';
        setFormData((prev) => ({ ...prev, logo: null }));
        return;
      }

      setLogoUrl(result.url);
    } catch {
      setFormErrors((prev) => ({
        ...prev,
        logo: "Une erreur inattendue s'est produite",
      }));
      e.target.value = '';
      setFormData((prev) => ({ ...prev, logo: null }));
    }
  };

  const handleInvalidFile = (e: React.InvalidEvent<HTMLInputElement>) => {
    setFormErrors((prev) => ({
      ...prev,
      logo: 'Type de fichier non supporté. Types acceptés : jpg, jpeg, png, gif, webp',
    }));
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    try {
      const response = await fetch(`/api/schools/${school.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          logo: logoUrl,
        }),
      });

      const text = await response.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error('Erreur de parsing JSON:', e);
        throw new Error("Une erreur est survenue lors de la modification de l'école.");
      }

      if (!response.ok) {
        if (data.details) {
          setFormErrors(data.details);
          return;
        }
        throw new Error(
          data.error || "Une erreur est survenue lors de la modification de l'école.",
        );
      }

      onSuccess();
    } catch (error) {
      console.error('Erreur:', error);
      setFormErrors({
        name:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de la modification de l'école",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSchoolStatus = async () => {
    try {
      const response = await fetch(`/api/schools/${school.id}/toggle-status`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error("Erreur lors du changement de statut de l'école");
      }

      onSuccess();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Modifier l&apos;école</h2>
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
      </div>

      <Card className="mx-auto mt-16 max-w-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l&apos;école</Label>
              <Input
                id="name"
                type="text"
                placeholder="Mon École"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setFormErrors({});
                }}
                className={formErrors.name ? 'border-red-500' : ''}
                required
                disabled={isSubmitting}
              />
              {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo</Label>
              <Input
                id="logo"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleLogoChange}
                onInvalid={handleInvalidFile}
                className={formErrors.logo ? 'border-red-500' : ''}
                disabled={isSubmitting}
              />
              {formErrors.logo && <p className="mt-1 text-sm text-red-500">{formErrors.logo}</p>}
              {logoUrl && (
                <div className="mt-2">
                  <Image
                    src={logoUrl}
                    alt="Aperçu du logo"
                    className="h-20 w-20 object-contain"
                    width={80}
                    height={80}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Chargement...' : "Modifier l'école"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant={school.isActive ? 'destructive' : 'success'} type="button">
                    {school.isActive ? 'Désactiver' : 'Activer'} l&apos;école
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {school.isActive ? 'Désactiver' : 'Activer'} l&apos;école {school.name} ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {school.isActive
                        ? "Cette action désactivera l'école et empêchera l'accès aux utilisateurs. Cette action peut être annulée."
                        : "Cette action réactivera l'école et permettra l'accès aux utilisateurs."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogAction
                      onClick={toggleSchoolStatus}
                      className={
                        school.isActive
                          ? 'bg-destructive hover:bg-destructive/90'
                          : 'bg-green-500 hover:bg-green-600'
                      }
                    >
                      {school.isActive ? 'Désactiver' : 'Activer'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
