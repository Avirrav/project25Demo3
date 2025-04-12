'use client';

import { Loader } from '@/components/ui/loader';

const Loading = () => {
  return (
    <div className="h-full w-full flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-2">
        <Loader size="large" />
        <p className="text-muted-foreground animate-pulse">Loading product...</p>
      </div>
    </div>
  );
};

export default Loading;