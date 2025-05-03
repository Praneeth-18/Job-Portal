import React from 'react';

export interface PageHeaderProps {
  heading: string;
  text?: string;
}

export function PageHeader({ heading, text }: PageHeaderProps) {
  return (
    <div className="pb-8">
      <div className="backdrop-blur-md bg-white/30 rounded-xl border border-white/50 shadow-lg p-6 mb-4">
        <h1 className="text-3xl font-medium text-black">{heading}</h1>
        {text && (
          <p className="mt-2 text-black max-w-3xl">
            {text}
          </p>
        )}
      </div>
    </div>
  );
} 