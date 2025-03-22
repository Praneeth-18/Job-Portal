import { JobListings } from '@/components/job-listings/JobListings';
import { db } from '@/lib/db';
import { JobListingType } from '@/types';

export const revalidate = 3600; // Revalidate every hour

// Define a type for our transformed job data
type TransformedJobListing = {
  id: number;
  positionTitle: string;
  postingDate: Date;
  applyLink: string | null;
  workModel: string | null;
  location: string | null;
  company: string;
  companySize: string | null;
  companyIndustry: string | null;
  salary: string | null;
  qualifications: string | null;
  h1bSponsored: boolean;
  isNewGrad: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt: Date;
  contentHash: string;
};

async function getUserApplications(userId: string = 'default-user') {
  try {
    // Get all job IDs that the user has applied to
    const applications = await db.userApplication.findMany({
      where: {
        userId: userId,
      },
      select: {
        jobListingId: true,
      },
    });
    
    return applications.map(app => app.jobListingId);
  } catch (error) {
    console.error('Error fetching user applications:', error);
    return [];
  }
}

async function getJobListings(): Promise<JobListingType[]> {
  const jobs = await db.jobListing.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      postingDate: 'desc',
    },
    take: 500, // Limit to 500 most recent job listings
    select: {
      id: true,
      positionTitle: true,
      postingDate: true,
      applyLink: true,
      workModel: true,
      location: true,
      company: true,
      companySize: true,
      companyIndustry: true,
      salary: true,
      qualifications: true,
      h1bSponsored: true,
      isNewGrad: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      lastSeenAt: true,
      contentHash: true,
    },
  });

  // Log the h1bSponsored values from the database
  console.log("Raw h1bSponsored values from database:");
  const h1bJobs = jobs.filter(job => job.h1bSponsored === true);
  console.log(`Found ${h1bJobs.length} jobs with h1bSponsored=true in database`);
  h1bJobs.forEach(job => {
    console.log(`${job.positionTitle} (${job.company}): h1bSponsored=${job.h1bSponsored}`);
  });

  // Transform the data from camelCase to the expected format and handle null values
  return jobs.map(job => ({
    id: job.id,
    positionTitle: job.positionTitle,
    postingDate: job.postingDate,
    applyLink: job.applyLink,
    workModel: job.workModel,
    location: job.location,
    company: job.company,
    companySize: job.companySize,
    companyIndustry: job.companyIndustry,
    salary: job.salary,
    qualifications: job.qualifications,
    h1bSponsored: job.h1bSponsored === true,
    isNewGrad: job.isNewGrad === true,
    isActive: job.isActive,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    lastSeenAt: job.lastSeenAt,
    contentHash: job.contentHash
  }));
}

export default async function DashboardPage() {
  // Get all jobs and user applications
  const [jobs, appliedJobIds] = await Promise.all([
    getJobListings(),
    getUserApplications()
  ]);

  // Filter out jobs that the user has already applied to
  const availableJobs = jobs.filter(job => !appliedJobIds.includes(job.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black">Job Listings</h1>
        <p className="text-gray-900">Browse and apply for jobs</p>
      </div>
      <JobListings jobs={availableJobs} />
    </div>
  );
} 