'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Calculate range of pages to show
  const getPageRange = () => {
    const range = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }
    
    return range;
  };
  
  const pageRange = getPageRange();
  
  return (
    <nav className="flex justify-center">
      <ul className="flex space-x-1">
        {/* Previous Button */}
        <li>
          <button
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`backdrop-blur-md border border-white/50 flex items-center justify-center px-3 py-2 rounded-lg text-sm
                      ${currentPage === 1 
                        ? 'text-gray-400 bg-white/20 cursor-not-allowed' 
                        : 'text-black bg-white/40 hover:bg-white/50 transition-all'} `}
            aria-label="Previous Page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </li>
        
        {/* Page 1 (if not in range) */}
        {pageRange[0] > 1 && (
          <>
            <li>
              <button
                onClick={() => onPageChange(1)}
                className="backdrop-blur-md border border-white/50 flex items-center justify-center w-10 h-10 rounded-lg text-sm 
                        text-black bg-white/40 hover:bg-white/50 transition-all"
              >
                1
              </button>
            </li>
            {pageRange[0] > 2 && (
              <li className="flex items-center">
                <span className="px-2 text-black">...</span>
              </li>
            )}
          </>
        )}
        
        {/* Page Numbers */}
        {pageRange.map((page) => (
          <li key={page}>
            <button
              onClick={() => onPageChange(page)}
              className={`backdrop-blur-md border border-white/50 flex items-center justify-center w-10 h-10 rounded-lg text-sm transition-all
                        ${currentPage === page 
                          ? 'text-white bg-blue-500/70 font-medium' 
                          : 'text-black bg-white/40 hover:bg-white/50'}`}
            >
              {page}
            </button>
          </li>
        ))}
        
        {/* Last Page (if not in range) */}
        {pageRange[pageRange.length - 1] < totalPages && (
          <>
            {pageRange[pageRange.length - 1] < totalPages - 1 && (
              <li className="flex items-center">
                <span className="px-2 text-black">...</span>
              </li>
            )}
            <li>
              <button
                onClick={() => onPageChange(totalPages)}
                className="backdrop-blur-md border border-white/50 flex items-center justify-center w-10 h-10 rounded-lg text-sm 
                        text-black bg-white/40 hover:bg-white/50 transition-all"
              >
                {totalPages}
              </button>
            </li>
          </>
        )}
        
        {/* Next Button */}
        <li>
          <button
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`backdrop-blur-md border border-white/50 flex items-center justify-center px-3 py-2 rounded-lg text-sm 
                      ${currentPage === totalPages 
                        ? 'text-gray-400 bg-white/20 cursor-not-allowed' 
                        : 'text-black bg-white/40 hover:bg-white/50 transition-all'}`}
            aria-label="Next Page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </li>
      </ul>
    </nav>
  );
} 