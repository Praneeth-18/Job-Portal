'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Filter, CheckCircle2, Briefcase, GraduationCap } from 'lucide-react';
import { JobListingCard } from './JobListingCard';
import { JobListingType, JobCategory } from '@/types';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Pagination } from '@/components/Pagination';

// Define CategoryStats type
export type CategoryStats = {
  category: string;
  count: number;
  totalPages: number;
};

interface JobListingsProps {
  jobs: JobListingType[];
  totalPages: number;
  currentPage: number;
  allCategories: string[];
  selectedCategory: string;
  categoryStats?: CategoryStats[]; // Optional for backward compatibility
}

export function JobListings({ 
  jobs, 
  totalPages, 
  currentPage, 
  allCategories, 
  selectedCategory,
  categoryStats = []
}: JobListingsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState({
    search: '',
    category: selectedCategory || 'Software Engineering',
    showH1b: false,
    showNewGrad: false,
    h1bSponsored: false,
    isNewGrad: false,
  });
  
  const [appliedJobs, setAppliedJobs] = useState<{[key: string]: boolean}>({});
  const [hideApplied, setHideApplied] = useState(false);

  // Update filters when selectedCategory changes
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      category: selectedCategory || 'Software Engineering'
    }));
  }, [selectedCategory]);
  
  // Load applied jobs from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadAppliedJobs = () => {
        const applied: {[key: string]: boolean} = {};
        
        // Loop through localStorage to find applied jobs
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('job_applied_')) {
            const jobId = key.replace('job_applied_', '');
            applied[jobId] = true;
          }
        }
        
        setAppliedJobs(applied);
      };
      
      loadAppliedJobs();
      
      // Add event listener to update when localStorage changes
      window.addEventListener('storage', loadAppliedJobs);
      
      return () => {
        window.removeEventListener('storage', loadAppliedJobs);
      };
    }
  }, []);

  // Log category stats for debugging
  useEffect(() => {
    if (categoryStats.length > 0) {
      console.log('Category Stats:', categoryStats);
      console.log('Selected Category:', selectedCategory);
      const stat = categoryStats.find(s => s.category === selectedCategory);
      if (stat) {
        console.log(`Found ${stat.count} jobs for ${selectedCategory} with ${stat.totalPages} pages`);
      }
    }
  }, [categoryStats, selectedCategory]);

  // Get category count from categoryStats
  const getCategoryCount = (category: string): number => {
    const stat = categoryStats.find(s => s.category === category);
    return stat ? stat.count : 0;
  };

  // Get total items to display count
  const getDisplayCount = (): number => {
    if (selectedCategory && selectedCategory !== 'All Categories') {
      return getCategoryCount(selectedCategory);
    }
    return jobs.length;
  };

  // Function to handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    
    // Create new URLSearchParams object
    const params = new URLSearchParams(searchParams.toString());
    // Update category and reset to page 1
    params.set('category', newCategory);
    params.set('page', '1');
    
    // Navigate to new URL with updated parameters
    router.push(`${pathname}?${params.toString()}`);
  };

  // Function to handle pagination
  const goToPage = (page: number) => {
    // Create new URLSearchParams object
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    if (selectedCategory) {
      params.set('category', selectedCategory);
    }
    
    // Navigate to new URL with updated parameters
    router.push(`${pathname}?${params.toString()}`);
  };

  // Function to handle H1B button click
  const handleH1BFilterClick = () => {
    router.push('/h1b-jobs');
  };

  // Function to handle New Grad button click
  const handleNewGradFilterClick = () => {
    router.push('/new-grad');
  };
  
  // Function to toggle hide applied jobs
  const toggleHideApplied = () => {
    setHideApplied(!hideApplied);
  };

  // Filter jobs based on applied status
  const filteredJobs = jobs.filter(job => {
    // Hide job if it's been applied to and hideApplied is true
    if (hideApplied && appliedJobs[job.id.toString()]) {
      return false;
    }
    
    // Client-side search filter
    if (filters.search && !job.positionTitle?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !job.company?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-8">
      {/* Search and filters section with Glassmorphism styling */}
      <div className="backdrop-blur-md bg-white/30 p-6 rounded-xl border border-white/50 shadow-lg" 
           style={{ background: 'rgba(255, 255, 255, 0.25)' }}>
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-4">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {/* Category Selector - Glassmorphism style */}
            <div className="w-full md:w-1/3">
              <label htmlFor="category" className="block text-sm font-medium text-black mb-2">
                Job Category
              </label>
              <div className="relative">
                <select
                  id="category"
                  className="w-full pl-4 pr-10 py-3 text-base text-gray-900 bg-white/40 backdrop-blur-md
                            border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 
                            shadow-sm transition-all"
                  value={filters.category}
                  onChange={handleCategoryChange}
                >
                  {allCategories.map((category) => (
                    <option key={category} value={category} className="bg-white text-gray-900">
                      {category} ({getCategoryCount(category)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Search Box - Glassmorphism style */}
            <div className="w-full md:w-2/3">
              <label htmlFor="search" className="block text-sm font-medium text-black mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  className="block w-full pl-10 pr-4 py-3 text-base text-gray-900 bg-white/40 backdrop-blur-md
                           border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400
                           shadow-sm transition-all"
                  placeholder="Search by title or company"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-black" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filter buttons - Glassmorphism style */}
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={handleH1BFilterClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/70 text-white font-medium rounded-lg 
                     backdrop-blur-md border border-white/30 shadow-md hover:bg-blue-600/70 transition-all"
          >
            <Briefcase className="h-4 w-4" />
            H1B Jobs
          </button>
          
          <button
            onClick={handleNewGradFilterClick}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/70 text-white font-medium rounded-lg
                     backdrop-blur-md border border-white/30 shadow-md hover:bg-purple-600/70 transition-all"
          >
            <GraduationCap className="h-4 w-4" />
            New Grad
          </button>
          
          <button
            onClick={toggleHideApplied}
            className={`flex items-center gap-2 px-4 py-2 ${hideApplied ? 'bg-green-500/70' : 'bg-gray-500/70'} 
                       text-white font-medium rounded-lg backdrop-blur-md border border-white/30 shadow-md
                       hover:${hideApplied ? 'bg-green-600/70' : 'bg-gray-600/70'} transition-all`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {hideApplied ? 'Showing Unapplied' : 'Hide Applied Jobs'}
          </button>
        </div>
      </div>

      {/* Job count summary - Glassmorphism style */}
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium text-black bg-white/40 backdrop-blur-md px-4 py-2 
                       rounded-lg border border-white/50 shadow-sm">
          Showing {filteredJobs.length} of {getDisplayCount()} jobs
          {selectedCategory && selectedCategory !== 'All Categories' && ` in ${selectedCategory}`}
          {hideApplied && ' (hiding applied jobs)'}
        </div>
      </div>

      {/* Pagination at top */}
      {totalPages > 1 && (
        <div className="my-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </div>
      )}

      {/* Job listings grid - Glassmorphism inspired layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredJobs.map((job) => (
          <JobListingCard key={job.id} job={job} />
        ))}
      </div>

      {/* Pagination at bottom */}
      {totalPages > 1 && (
        <div className="my-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </div>
      )}

      {filteredJobs.length === 0 && (
        <div className="text-center p-10 bg-white/30 backdrop-blur-md rounded-xl border border-white/50 shadow-lg">
          <h3 className="text-xl font-semibold text-black">No job listings found</h3>
          <p className="text-black mt-2">
            Try adjusting your filters or search criteria
          </p>
        </div>
      )}
    </div>
  );
} 