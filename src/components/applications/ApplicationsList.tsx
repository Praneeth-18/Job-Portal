'use client';

import { useState, useEffect } from 'react';
import { UserApplication, JobListing, ApplicationStatusHistory } from '@prisma/client';
import { format } from 'date-fns';
import { Building2, MapPin, Calendar, ChevronDown, Filter } from 'lucide-react';

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
  const [filters, setFilters] = useState({
    status: '',
    category: '',
  });
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithDetails[]>(applications);

  // Extract unique categories from job listings for all application categories
  const availableCategories = (() => {
    // Get categories from the applications
    const appCategories = new Set<string>();
    applications.forEach(app => {
      if (app.jobListing.jobCategory) {
        appCategories.add(app.jobListing.jobCategory);
      }
    });
    
    return Array.from(appCategories).sort();
  })();

  // Filter applications based on selected filters
  useEffect(() => {
    let result = [...applications];
    
    if (filters.status) {
      result = result.filter(app => app.currentStatus === filters.status);
    }
    
    if (filters.category) {
      result = result.filter(app => app.jobListing.jobCategory === filters.category);
    }
    
    setFilteredApplications(result);
  }, [applications, filters]);

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
      {/* Filter controls */}
      <div className="backdrop-blur-md bg-white/30 p-6 rounded-xl border border-white/50 shadow-lg">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-black mb-1">Filter by Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="rounded-lg border border-white/50 px-3 py-2 text-sm font-medium text-black bg-white/40 backdrop-blur-sm"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          
          {availableCategories.length > 0 && (
            <div className="flex flex-col">
              <label className="text-sm font-medium text-black mb-1">Filter by Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="rounded-lg border border-white/50 px-3 py-2 text-sm font-medium text-black bg-white/40 backdrop-blur-sm"
              >
                <option value="">All Categories</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex items-end">
            <button 
              onClick={() => setFilters({ status: '', category: '' })}
              className="rounded-lg border border-white/50 bg-white/40 backdrop-blur-sm px-4 py-2 text-sm font-medium text-black hover:bg-white/50 transition-all"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      
      {/* Active filters display */}
      {(filters.status || filters.category) && (
        <div className="flex items-center gap-2 text-sm text-black bg-white/40 backdrop-blur-md px-4 py-2 rounded-lg border border-white/50 shadow-sm">
          <Filter className="h-4 w-4" />
          <span>Showing: </span>
          {filters.status && <span className="font-medium">{filters.status}</span>}
          {filters.status && filters.category && <span> in </span>}
          {filters.category && <span className="font-medium">{filters.category}</span>}
          <span> ({filteredApplications.length} applications)</span>
        </div>
      )}

      {/* Applications list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredApplications.map((application) => {
          // Determine gradient colors based on status
          const getStatusColors = () => {
            switch(application.currentStatus) {
              case 'Interviewing':
                return 'from-blue-400/40 to-blue-500/30';
              case 'Rejected':
                return 'from-red-400/40 to-red-500/30';
              case 'Offer Received':
                return 'from-green-400/40 to-green-500/30';
              default: // Applied
                return 'from-purple-400/40 to-purple-500/30';
            }
          };
          
          return (
            <div
              key={application.id}
              className={`rounded-xl border border-white/50 bg-white/30 backdrop-blur-md p-5 shadow-lg 
                          hover:shadow-xl hover:translate-y-[-8px] transition-all duration-300 ease-in-out
                          bg-gradient-to-br ${getStatusColors()}`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-black">
                      {application.jobListing.positionTitle}
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-black">
                      <Building2 className="h-4 w-4" />
                      <span>{application.jobListing.company}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {application.jobListing.jobCategory && (
                        <span className="inline-block bg-white/50 text-black border border-white/30 rounded-lg backdrop-blur-sm px-3 py-1 text-xs font-medium">
                          {application.jobListing.jobCategory}
                        </span>
                      )}
                      
                      {/* Status badge */}
                      <span className={`inline-block backdrop-blur-sm px-3 py-1 text-xs font-medium rounded-lg border border-white/30
                                      ${application.currentStatus === 'Interviewing' ? 'bg-blue-500/70 text-white' : 
                                        application.currentStatus === 'Rejected' ? 'bg-red-500/70 text-white' :
                                        application.currentStatus === 'Offer Received' ? 'bg-green-500/70 text-white' :
                                        'bg-purple-500/70 text-white'}`}>
                        {application.currentStatus}
                      </span>
                    </div>
                  </div>
                  <select
                    value={application.currentStatus}
                    onChange={(e) => handleStatusChange(application.id, e.target.value)}
                    className="rounded-lg border border-white/50 bg-white/40 backdrop-blur-sm px-3 py-2 text-sm font-medium text-black hover:bg-white/50 transition-all"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-black">
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
                    <div className="mt-4 space-y-4 border-l border-white/70 pl-4">
                      {application.statusHistory.map((history) => (
                        <div key={history.id} className="relative">
                          <div className="absolute -left-[0.75rem] h-3 w-3 rounded-full bg-white/70 backdrop-blur-sm shadow-sm" />
                          <div className="text-sm">
                            <p className="font-medium text-black">{history.status}</p>
                            <p className="text-black">
                              {format(new Date(history.changedAt), 'MMM d, yyyy h:mm a')}
                            </p>
                            {history.notes && (
                              <p className="mt-1 text-black">{history.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredApplications.length === 0 && (
        <div className="text-center p-10 bg-white/30 backdrop-blur-md rounded-xl border border-white/50 shadow-lg">
          <p className="text-black font-medium">
            {applications.length === 0 
              ? "No applications yet" 
              : "No applications match your filter criteria"}
          </p>
        </div>
      )}
    </div>
  );
} 