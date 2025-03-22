import { ApplicationsList } from '@/components/applications/ApplicationsList';
import { db } from '@/lib/db';

export const revalidate = 0; // Don't cache this page

async function getApplications() {
  const applications = await db.userApplication.findMany({
    where: {
      userId: 'default-user', // We'll update this when we add authentication
    },
    include: {
      jobListing: true,
      statusHistory: {
        orderBy: {
          changedAt: 'desc',
        },
      },
    },
    orderBy: {
      appliedAt: 'desc',
    },
  });

  return applications;
}

export default async function ApplicationsPage() {
  const applications = await getApplications();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black">My Applications</h1>
        <p className="text-gray-900">Track and manage your job applications</p>
      </div>
      <ApplicationsList applications={applications} />
    </div>
  );
} 