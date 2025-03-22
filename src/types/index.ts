// Define a job listing type that matches our transformed data
export interface JobListingType {
  id: number;
  positionTitle: string;
  postingDate: Date;
  applyLink?: string | null;
  workModel?: string | null;
  location?: string | null;
  company: string;
  companySize?: string | null;
  companyIndustry?: string | null;
  salary?: string | null;
  qualifications?: string | null;
  h1bSponsored: boolean;
  isNewGrad: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt: Date;
  contentHash: string;
} 