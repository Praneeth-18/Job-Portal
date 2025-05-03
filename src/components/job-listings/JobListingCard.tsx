'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Building2, MapPin, Calendar, ExternalLink, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { JobListingType } from '@/types';

interface JobListingCardProps {
  job: JobListingType;
}

export function JobListingCard({ job }: JobListingCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAppliedPrompt, setShowAppliedPrompt] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBrowser, setIsBrowser] = useState(false);
  const [showApplyConfirmation, setShowApplyConfirmation] = useState(false);

  // Only run on client-side to prevent localStorage errors during SSR
  useEffect(() => {
    setIsBrowser(true);
    
    // Check if user has already applied
    if (typeof window !== 'undefined') {
      const appliedState = localStorage.getItem(`job_applied_${job.id}`);
      if (appliedState === 'true') {
        setHasApplied(true);
      }
      
      // Check if user visited the apply link but hasn't confirmed
      // Only show application prompt if the user is coming back from applying
      // and if there's a stored 'visited' state
      const jobApplyState = localStorage.getItem(`job_apply_${job.id}`);
      if (jobApplyState === 'visited' && !hasApplied && document.referrer) {
        setShowAppliedPrompt(true);
      }
    }

    // Add focus event listener to check when user returns to the page after applying
    const handleFocus = () => {
      if (typeof window !== 'undefined' && !hasApplied) {
        const jobApplyState = localStorage.getItem(`job_apply_${job.id}`);
        if (jobApplyState === 'visited' && document.referrer) {
          setShowAppliedPrompt(true);
        }
      }
    };
    
    // Add event listener for when user returns to the tab
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [job.id, hasApplied]);

  function applyToJob() {
    // Use actual_apply_link if available, otherwise fall back to applyLink
    const applicationLink = job.actualApplyLink || job.applyLink;
    
    if (!applicationLink) return;
    
    // Only interact with localStorage on the client
    if (typeof window !== 'undefined') {
      localStorage.setItem(`job_apply_${job.id}`, 'visited');
      
      // Open the application link in a new tab
      window.open(applicationLink, '_blank');
      
      // Show the confirmation dialog immediately
      setShowAppliedPrompt(true);
    }
  }

  async function recordApplication(didApply: boolean) {
    if (!didApply) {
      // User indicates they didn't apply, so clear the flag
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`job_apply_${job.id}`);
      }
      setShowAppliedPrompt(false);
      return;
    }

    setIsSubmitting(true);
    console.log('Starting application recording for job:', job.id);
    
    try {
      // Add a timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Request timeout reached');
        controller.abort();
      }, 10000); // 10 second timeout
      
      console.log('Sending POST request to /api/applications');
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobListingId: job.id,
          userId: 'default-user', // We'll update this when we add authentication
          currentStatus: 'Applied',
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('Received response with status:', response.status);

      // Handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('Response data:', data);
      } else {
        const textResponse = await response.text();
        console.log('Non-JSON response:', textResponse);
        data = { message: textResponse };
      }

      if (response.ok) {
        console.log('Application recorded successfully:', data);
        // Mark as applied in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(`job_applied_${job.id}`, 'true');
          localStorage.removeItem(`job_apply_${job.id}`);
        }
        setHasApplied(true);
        setShowAppliedPrompt(false);
        
        // Don't redirect to my applications page, just stay on the homepage
      } else {
        // Handle 409 Conflict error (application already exists) as a success
        if (response.status === 409) {
          console.log('Application already exists, treating as success');
          // Still mark as applied since the application exists
          if (typeof window !== 'undefined') {
            localStorage.setItem(`job_applied_${job.id}`, 'true');
            localStorage.removeItem(`job_apply_${job.id}`);
          }
          setHasApplied(true);
          setShowAppliedPrompt(false);
        } else {
          console.error('Failed to record application:', data.error || response.statusText);
          alert(`Failed to record application: ${data.error || 'Unknown error'}`);
          setShowAppliedPrompt(false); // Close dialog on error
        }
      }
    } catch (error: any) {
      console.error('Error recording application:', error);
      
      // Handle abort error separately
      if (error.name === 'AbortError') {
        alert('Request timed out. Please try again later.');
      } else {
        alert('Error recording application: ' + (error.message || 'Unknown error'));
      }
      
      // Close the dialog on error
      setShowAppliedPrompt(false);
    } finally {
      console.log('Finishing application recording process');
      setIsSubmitting(false);
    }
  }

  const formatSalary = (salary: string | null | undefined) => {
    if (!salary) return 'Salary not specified';
    return salary;
  };

  const formatDate = (date: Date) => {
    try {
      const dateObj = new Date(date);
      return format(dateObj, 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatQualifications = (qualifications: string | null | undefined) => {
    if (!qualifications) return 'No qualifications specified';
    
    // Split by newlines or numbered lists (e.g. "1. ", "2. ")
    const items = qualifications.split(/\r?\n|(?=\d+\.\s)/);
    
    return (
      <ul className="list-disc pl-5 space-y-1">
        {items.map((item, index) => {
          const trimmed = item.trim();
          if (!trimmed) return null;
          // Remove the number at the beginning if it exists
          const cleanItem = trimmed.replace(/^\d+\.\s+/, '');
          return <li key={index}>{cleanItem}</li>;
        })}
      </ul>
    );
  };

  // Determine card colors based on job category for Glassmorphism style
  const getCategoryColors = () => {
    const category = job.jobCategory?.toLowerCase() || '';
    
    // Glassmorphism-inspired color combinations with transparency
    if (category.includes('software') || category.includes('engineer')) {
      return { bg: 'from-blue-400/20 to-blue-500/10', text: 'text-gray-800', accent: 'bg-blue-500/60' };
    } else if (category.includes('data')) {
      return { bg: 'from-purple-400/20 to-purple-500/10', text: 'text-gray-800', accent: 'bg-purple-500/60' };
    } else if (category.includes('product') || category.includes('manager')) {
      return { bg: 'from-amber-400/20 to-amber-500/10', text: 'text-gray-800', accent: 'bg-amber-500/60' };
    } else if (category.includes('design') || category.includes('ui')) {
      return { bg: 'from-pink-400/20 to-pink-500/10', text: 'text-gray-800', accent: 'bg-pink-500/60' };
    } else {
      return { bg: 'from-gray-400/20 to-gray-500/10', text: 'text-gray-800', accent: 'bg-gray-500/60' };
    }
  };
  
  const colors = getCategoryColors();

  // Only render client-side content if we're in the browser
  if (!isBrowser) {
  return (
      <div className="bg-white/30 backdrop-blur-md p-5 rounded-xl border border-white/30 shadow-md h-64">
        <div className="space-y-2 h-full flex flex-col justify-between">
          <div>
          <div className="flex items-start justify-between">
              <h3 className="text-lg font-medium text-black">
                {job.positionTitle}
              </h3>
            </div>
            <div className="mt-2">
              {job.jobCategory && (
                <Badge variant="glass">
                  {job.jobCategory}
                </Badge>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-black">
              <Building2 className="h-4 w-4" />
              <span>{job.company}</span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="glass">View Details</Button>
            <Button variant="default">Apply</Button>
          </div>
        </div>
      </div>
    );
  }

  // If the user has already applied, show a different styled card
  if (hasApplied) {
    return (
      <div className={`bg-white/30 backdrop-blur-md p-5 rounded-xl border border-white/30 shadow-md
                       bg-gradient-to-br from-green-400/20 to-green-500/10 ${colors.text}
                       hover:translate-y-[-4px] transition-all duration-300 ease-in-out`}>
        <div className="space-y-2 h-full flex flex-col">
          <div className="flex flex-col gap-2 flex-grow">
            <div className="absolute top-2 right-2">
              <Badge variant="success">
                <CheckCircle className="h-3 w-3 mr-1" /> Applied
              </Badge>
            </div>
            <h3 className="text-lg font-medium pr-20 line-clamp-2">
              {job.positionTitle}
            </h3>
            <div className="flex flex-wrap gap-1">
              {job.jobCategory && (
                <Badge variant="glass">
                  {job.jobCategory}
                </Badge>
              )}
              {job.h1bSponsored && (
                <Badge variant="default">
                  H1B
                </Badge>
              )}
              {job.isNewGrad && (
                <Badge variant="secondary">
                  New Grad
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4" />
              <span className="font-medium">{job.company}</span>
            </div>
            {job.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                <span>{job.location}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mt-auto">
            <Button
              variant="glass"
              className="flex-1 min-w-0 bg-white/80 border-gray-300 hover:bg-white hover:border-gray-400 text-gray-800 shadow-sm flex items-center justify-center"
              onClick={() => window.location.href = '/applications'}
            >
              View Application
            </Button>
            <Button
              variant="outline"
              className="flex-1 min-w-0 bg-white/80 border-gray-300 hover:bg-white hover:border-gray-400 text-gray-800 shadow-sm flex items-center justify-center gap-1"
              onClick={() => {
                const link = job.actualApplyLink || job.applyLink;
                if (link) window.open(link, '_blank');
              }}
            >
              <span>View Job Details</span>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white/30 backdrop-blur-md p-5 rounded-xl border border-white/30 shadow-md
                       bg-gradient-to-br ${colors.bg} ${colors.text} hover:shadow-lg 
                       hover:translate-y-[-4px] transition-all duration-300 ease-in-out`}>
        <div className="space-y-3 h-full flex flex-col justify-between">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-medium text-black line-clamp-2">
              {job.positionTitle}
            </h3>
            <div className="flex flex-wrap gap-1">
              {job.jobCategory && (
                <Badge variant="glass">
                  {job.jobCategory}
                </Badge>
              )}
              {job.h1bSponsored && (
                <Badge variant="default">
                  H1B
                </Badge>
              )}
              {job.isNewGrad && (
                <Badge variant="secondary">
                  New Grad
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4" />
              <span className="font-medium">{job.company}</span>
            </div>
            {job.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                <span>{job.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span>Posted: {formatDate(job.postingDate)}</span>
            </div>
            {job.salary && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4" />
                <span>{formatSalary(job.salary)}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="glass">
                  Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl bg-white/80 backdrop-blur-xl rounded-xl border border-white/40 shadow-lg">
                <DialogHeader>
                  <DialogTitle className="text-xl font-medium text-black">
                    {job.positionTitle}
                  </DialogTitle>
                  <DialogDescription className="text-black">
                    <div className="flex flex-wrap gap-2 my-2">
                      {job.jobCategory && (
                        <Badge variant="glass">
                          {job.jobCategory}
                        </Badge>
                      )}
                      {job.h1bSponsored && (
                        <Badge variant="default">
                          H1B Sponsored
                        </Badge>
                      )}
                      {job.isNewGrad && (
                        <Badge variant="secondary">
                          New Grad
                        </Badge>
                      )}
                      {job.workModel && (
                        <Badge variant="glass">
                          {job.workModel}
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg font-medium">{job.company}</p>
                    {job.location && <p>{job.location}</p>}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-md font-medium text-black border-b border-gray-200 pb-1">About This Role</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-black" />
                        <span className="text-black">Posted: {formatDate(job.postingDate)}</span>
                      </div>
                      {job.salary && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-black" />
                          <span className="text-black">{formatSalary(job.salary)}</span>
                        </div>
                      )}
                      {job.companySize && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4 text-black" />
                          <span className="text-black">Company Size: {job.companySize}</span>
                        </div>
                      )}
                      {job.companyIndustry && (
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4 text-black" />
                          <span className="text-black">Industry: {job.companyIndustry}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator className="my-4 border-gray-200" />
                  
                  {job.qualifications && (
                    <div>
                      <h4 className="text-md font-medium text-black border-b border-gray-200 pb-1">Requirements/Qualifications</h4>
                      <div className="mt-2 text-sm text-black">
                        {formatQualifications(job.qualifications)}
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4 flex gap-2">
                    <Button
                      onClick={applyToJob}
                      className="w-full"
                    >
                      Apply Now <ExternalLink className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              onClick={applyToJob}
              variant="default"
            >
              Apply
            </Button>
          </div>
        </div>
      </div>

      {/* Apply Confirmation Dialog - Show after user returns from applying */}
      {showAppliedPrompt && (
        <Dialog open={true} onOpenChange={(open) => {
          if (!open) setShowAppliedPrompt(false);
        }}>
          <DialogContent className="max-w-md bg-white/80 backdrop-blur-xl rounded-xl border border-white/40 shadow-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-medium text-black">Did you apply for this job?</DialogTitle>
              <DialogDescription className="text-black">
                Let us know if you completed your application for {job.positionTitle} at {job.company}.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-between mt-4">
              <Button 
                onClick={() => recordApplication(true)}
                disabled={isSubmitting}
                variant="success"
              >
                {isSubmitting ? "Recording..." : "Yes, I Applied"}
              </Button>
              <Button
                onClick={() => recordApplication(false)}
                disabled={isSubmitting}
                variant="glass"
              >
                No, Not Yet
              </Button>
            </div>
          </DialogContent>
      </Dialog>
      )}
    </>
  );
} 