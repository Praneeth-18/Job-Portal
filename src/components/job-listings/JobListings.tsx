'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search } from 'lucide-react';
import { JobListingCard } from './JobListingCard';
import { JobListingType } from '@/types';

interface JobListingsProps {
  jobs: JobListingType[];
}

export function JobListings({ jobs }: JobListingsProps) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    workModel: '',
    h1bSponsored: false,
    isNewGrad: false,
  });

  // Log the total jobs when the component mounts
  useEffect(() => {
    console.log(`Total job listings: ${jobs.length}`);
    const h1bJobs = jobs.filter(job => job.h1bSponsored === true);
    console.log(`Jobs with h1bSponsored=true: ${h1bJobs.length}`);
    console.log('H1B Jobs:', h1bJobs.map(job => ({ id: job.id, title: job.positionTitle, company: job.company })));
  }, [jobs]);

  // Filter jobs based on search and filters
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      search === '' ||
      job.positionTitle.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      (job.location && job.location.toLowerCase().includes(search.toLowerCase()));

    const matchesWorkModel =
      filters.workModel === '' ||
      (job.workModel && job.workModel.toLowerCase() === filters.workModel.toLowerCase());

    // When h1bSponsored filter is checked, only show jobs that have h1bSponsored=true
    const matchesH1b = !filters.h1bSponsored || (job.h1bSponsored === true);
    
    // When isNewGrad filter is checked, only show jobs that have isNewGrad=true
    const matchesNewGrad = !filters.isNewGrad || (job.isNewGrad === true);

    // Log filtering for H1B jobs if the filter is active
    if (filters.h1bSponsored && job.h1bSponsored === true) {
      console.log(`H1B Job matched: ${job.positionTitle} at ${job.company} (id: ${job.id})`);
    }

    return matchesSearch && matchesWorkModel && matchesH1b && matchesNewGrad;
  });

  // Log the filtered jobs when filters change
  useEffect(() => {
    if (filters.h1bSponsored) {
      console.log(`Filtered jobs with h1bSponsored: ${filteredJobs.length}`);
    }
  }, [filteredJobs.length, filters.h1bSponsored]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-700" />
          <input
            type="text"
            placeholder="Search jobs by title, company, or location..."
            className="w-full rounded-md border-2 border-gray-300 pl-10 pr-4 py-2 text-gray-900 placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <select
            className="rounded-md border-2 border-gray-300 px-4 py-2 text-gray-900"
            value={filters.workModel}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, workModel: e.target.value }))
            }
          >
            <option value="">All Work Models</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On Site">On Site</option>
          </select>
          <label className="flex items-center gap-2 text-gray-900">
            <input
              type="checkbox"
              checked={filters.h1bSponsored}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, h1bSponsored: e.target.checked }))
              }
            />
            H1B Sponsored
          </label>
          <label className="flex items-center gap-2 text-gray-900">
            <input
              type="checkbox"
              checked={filters.isNewGrad}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, isNewGrad: e.target.checked }))
              }
            />
            New Grad
          </label>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredJobs.map((job) => (
          <JobListingCard key={job.id} job={job} />
        ))}
      </div>

      {filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No jobs found matching your criteria</p>
        </div>
      )}
    </div>
  );
} 