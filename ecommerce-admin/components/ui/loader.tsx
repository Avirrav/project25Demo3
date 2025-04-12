'use client';

import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export const Loader = ({ className, size = 'medium' }: SpinnerProps) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div role="status" className={cn("animate-pulse", className)}>
      <div className={cn(
        "border-2 rounded-full animate-spin",
        "border-t-primary",
        "border-l-transparent border-r-transparent border-b-transparent",
        sizeClasses[size]
      )} />
      <span className="sr-only">Loading...</span>
    </div>
  );
};