'use client';

import { Prisma } from '@prisma/client';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

import React from 'react';

import StatusBadge from '@/components/app/common/StatusBadge';
import ProfileAvatar from '@/components/app/profileForm/ProfileAvatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  getStatusLabel,
  getStatusVariant,
  RequestStatus,
} from '@/utils/students/dashboard/status-mapping.utils';

import { useJobRequest } from '@/context/job-request.context';

type JobRequestWithRelations = Prisma.JobRequestGetPayload<{
  include: {
    student: {
      include: {
        user: true;
      };
    };
    job: {
      include: {
        company: true;
      };
    };
  };
}>;

export default function JobRequestView({
  requests,
  setRequests,
}: {
  requests: JobRequestWithRelations[];
  setRequests: React.Dispatch<React.SetStateAction<JobRequestWithRelations[]>>;
}) {
  const { selectedRequest, setSelectedRequest } = useJobRequest();

  const updateRequestStatus = async (newStatus: RequestStatus) => {
    if (!selectedRequest) return;

    try {
      const response = await axios.put(
        `/api/students/job-requests/${selectedRequest.id}`,
        { status: newStatus },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status >= 400) throw new Error('Failed to update request status');

      const updatedRequests = requests.map((req) =>
        req.id === selectedRequest.id ? { ...req, status: newStatus } : req,
      );

      setRequests(updatedRequests);
      setSelectedRequest({ ...selectedRequest, status: newStatus });

      toast.success(`Statut mis à jour avec succès: ${getStatusLabel(newStatus)}`);
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  if (!selectedRequest) {
    return (
      <Card className="flex h-[500px] items-center justify-center">
        <CardContent className="text-center">
          <h3 className="text-muted-foreground mb-2 text-xl font-medium">
            Sélectionnez une candidature
          </h3>
          <p className="text-muted-foreground text-sm">
            Cliquez sur une candidature pour voir les détails
          </p>
        </CardContent>
      </Card>
    );
  }

  const { student, job, status, createdAt, updatedAt } = selectedRequest;
  const { firstName, lastName } = student.user;

  const formattedCreatedDate = format(new Date(createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr });
  const formattedUpdatedDate = format(new Date(updatedAt), 'dd MMMM yyyy à HH:mm', { locale: fr });

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="text-xl">Détails de la candidature</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Candidat</h3>
          <div className="bg-muted/50 flex items-center gap-3 rounded-md p-3">
            <ProfileAvatar
              firstName={firstName}
              lastName={lastName}
              photoUrl=""
              size="md"
              className="border border-gray-200 dark:border-gray-700"
            />
            <div>
              <h4 className="font-medium">{`${firstName} ${lastName}`}</h4>
              <Button variant="link" className="text-primary h-auto px-0 text-sm" asChild>
                <a href={`/students/${student.id}`}>Voir profil</a>
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Offre</h3>
          <div className="bg-muted/50 rounded-md p-3">
            <h4 className="font-medium">{job.name}</h4>
            <p className="text-muted-foreground text-sm">{job.company.name}</p>
            <Button variant="link" className="text-primary h-auto px-0 text-sm" asChild>
              <a href={`/jobs/${job.id}`}>Voir l&apos;offre</a>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Statut</h3>
            <StatusBadge status={getStatusLabel(status)} variant={getStatusVariant(status)} />
          </div>

          <div className="space-y-3">
            <Label htmlFor="status-select">Mettre à jour le statut</Label>
            <Select
              defaultValue={status}
              onValueChange={(value) => updateRequestStatus(value as RequestStatus)}
            >
              <SelectTrigger id="status-select">
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="ACCEPTED">Acceptée</SelectItem>
                <SelectItem value="REJECTED">Rejetée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2 pt-2 text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium">Date de candidature:</span> {formattedCreatedDate}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium">Dernière modification:</span> {formattedUpdatedDate}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
