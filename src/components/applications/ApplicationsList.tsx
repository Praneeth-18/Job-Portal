'use client';

import { useState } from 'react';
import { UserApplication, JobListing, ApplicationStatusHistory } from '@prisma/client';
import { format } from 'date-fns';
import { Building2, MapPin, Calendar, ChevronDown } from 'lucide-react';

type ApplicationWithDetails = UserApplication & {
  jobListing: JobListing;
  statusHistory: ApplicationStatusHistory[];
};

interface ApplicationsListProps {
  applications: ApplicationWithDetails[];
}

const STATUS_OPTIONS = ['Applied', 'Interviewing', 'Rejected', 'Offer Received'];

export function ApplicationsList({ applications }: ApplicationsListProps) {
  const [expandedTimelines, setExpandedTimelines] = useState<Record<number, boolean>>({});

  const toggleTimeline = (applicationId: number) => {
    setExpandedTimelines((prev) => ({
      ...prev,
      [applicationId]: !prev[applicationId],
    }));
  };

  const handleStatusChange = async (applicationId: number, newStatus: string) => {
    try {
      const response = await fetch('/api/applications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update application status. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {applications.map((application) => (
        <div
          key={application.id}
          className="rounded-lg border-2 border-gray-300 bg-white p-6 shadow-sm"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {application.jobListing.positionTitle}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                  <Building2 className="h-4 w-4" />
                  <span>{application.jobListing.company}</span>
                </div>
              </div>
              <select
                value={application.currentStatus}
                onChange={(e) => handleStatusChange(application.id, e.target.value)}
                className="rounded-md border-2 border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-700">
              {application.jobListing.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{application.jobListing.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Applied on {format(new Date(application.appliedAt), 'MMM d, yyyy')}</span>
              </div>
            </div>

            <div>
              <button
                onClick={() => toggleTimeline(application.id)}
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                <ChevronDown
                  className={`h-4 w-4 transform transition-transform ${
                    expandedTimelines[application.id] ? 'rotate-180' : ''
                  }`}
                />
                {expandedTimelines[application.id] ? 'Hide' : 'Show'} Timeline
              </button>

              {expandedTimelines[application.id] && (
                <div className="mt-4 space-y-4 border-l-2 border-gray-200 pl-4">
                  {application.statusHistory.map((history) => (
                    <div key={history.id} className="relative">
                      <div className="absolute -left-[1.075rem] h-2 w-2 rounded-full bg-gray-400" />
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{history.status}</p>
                        <p className="text-gray-500">
                          {format(new Date(history.changedAt), 'MMM d, yyyy h:mm a')}
                        </p>
                        {history.notes && (
                          <p className="mt-1 text-gray-600">{history.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {applications.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No applications yet</p>
        </div>
      )}
    </div>
  );
} 