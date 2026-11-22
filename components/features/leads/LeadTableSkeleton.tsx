import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface LeadTableSkeletonRowsProps {
  rows?: number;
}

export function LeadTableSkeletonRows({
  rows = 5,
}: LeadTableSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => {
        const isEven = index % 2 === 1;
        return (
          <TableRow
            key={index}
            className={`border-b border-stone-200/60 ${
              isEven ? "bg-oatmeal-100/40" : "bg-paper"
            }`}
          >
            {/* Business / Lead Name */}
            <TableCell className="px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
              </div>
            </TableCell>

            {/* Status */}
            <TableCell className="px-4 py-3.5">
              <Skeleton className="h-6 w-24 rounded-full" />
            </TableCell>

            {/* Contact Stack */}
            <TableCell className="px-4 py-3.5">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-24" />
              </div>
            </TableCell>

            {/* Priority & Follow-Up */}
            <TableCell className="px-4 py-3.5">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-3 w-20" />
              </div>
            </TableCell>

            {/* Dealt By */}
            <TableCell className="px-4 py-3.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                <Skeleton className="h-3.5 w-20" />
              </div>
            </TableCell>

            {/* Website Status / Opportunity */}
            <TableCell className="px-4 py-3.5">
              <Skeleton className="h-5 w-28 rounded-full" />
            </TableCell>

            {/* Actions */}
            <TableCell className="px-4 py-3.5 text-center">
              <Skeleton className="h-7 w-7 rounded-lg mx-auto" />
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
}
