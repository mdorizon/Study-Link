export interface CreateSchoolDTO {
  name: string;
  domainId: string;
  logo?: string | null;
}

export interface UpdateSchoolDTO {
  name?: string;
  domainId?: string;
  logo?: string | null;
}

export interface SchoolResponseDTO {
  id: string;
  name: string;
  domainId: string;
  logo?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
