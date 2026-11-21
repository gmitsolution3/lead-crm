import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchGroupSkeletonGridProps {
  count?: number;
}

export function SearchGroupSkeletonCard() {
  return (
    <Card className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      {/* Top accent bar shimmer */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-stone-200/60" />

      <div>
        {/* Top header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>

        {/* Query and description */}
        <div className="mt-4 space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      </div>

      {/* Footer row */}
      <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-3">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
    </Card>
  );
}

export function SearchGroupSkeletonGrid({
  count = 6,
}: SearchGroupSkeletonGridProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SearchGroupSkeletonCard key={i} />
      ))}
    </div>
  );
}
