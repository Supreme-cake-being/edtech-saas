import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      role="status"
      className={[
        'animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600',
        sizeClasses[size],
        className,
      ].join(' ')}
      aria-label="Loading"
    />
  );
}
