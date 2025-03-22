'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Dialog } from '@headlessui/react';
import { Building2, MapPin, Calendar } from 'lucide-react';
import { JobListingType } from '@/types';

interface JobListingCardProps {
  job: JobListingType;
}

export function JobListingCard({ job }: JobListingCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleApply = async () => {
    // Open the job URL in a new tab if it exists
    if (job.applyLink) {
      window.open(job.applyLink, '_blank');
    }
    // Show the confirmation dialog
    setIsDialogOpen(true);
  };

  const handleConfirmApplication = async () => {
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: job.id,
          userId: 'default-user', // We'll update this when we add authentication
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error response:', data);
        throw new Error(data.error || 'Failed to save application');
      }

      console.log('Application saved successfully:', data);
      
      // Close the dialog
      setIsDialogOpen(false);
      
      // Refresh the page to update the job listings
      window.location.reload();
    } catch (error) {
      console.error('Error saving application:', error);
      alert('Failed to save your application. Please try again.');
    }
  };

  return (
    <>
      <div className="rounded-lg border-2 border-gray-300 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {job.positionTitle}
            </h3>
            <div className="flex gap-2">
              {job.h1bSponsored && (
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  H1B
                </span>
              )}
              {job.isNewGrad && (
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  New Grad
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Building2 className="h-4 w-4" />
              <span>{job.company}</span>
            </div>
            {job.location && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="h-4 w-4" />
                <span>{job.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(job.postingDate.toISOString().split('T')[0]), 'MMM d, yyyy')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium text-gray-900">{job.workModel}</span>
            </div>
            {job.salary && (
              <div className="text-sm">
                <span className="font-medium text-gray-900">{job.salary}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleApply}
            className="mt-4 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          >
            Apply Now
          </button>
        </div>
      </div>

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Confirm Application
            </Dialog.Title>

            <div className="mt-4">
              <p className="text-gray-500">
                Have you applied for this position at {job.company}?
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200"
                onClick={() => setIsDialogOpen(false)}
              >
                No, not yet
              </button>
              <button
                type="button"
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                onClick={handleConfirmApplication}
              >
                Yes, I applied
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
} 