"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  limit?: number;
  pageSizeOptions?: number[];
  onPageChange: (newPage: number) => void;
  onLimitChange?: (newLimit: number) => void;
  isLoading?: boolean;
  itemLabel?: string;
  limitLabel?: string;
  variant?: "range" | "page-of";
  hideOnSinglePage?: boolean;
  className?: string;
}

export function generatePageNumbers(
  current: number,
  total: number
): (number | "...")[] {
  if (total <= 1) return [1];
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, "...", total];
  }
  if (current >= total - 2) {
    return [1, "...", total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  pageSizeOptions,
  onPageChange,
  onLimitChange,
  isLoading = false,
  itemLabel = "items",
  limitLabel,
  variant = "range",
  hideOnSinglePage = false,
  className,
}: PaginationProps) {
  if (hideOnSinglePage && totalPages <= 1) {
    return null;
  }

  const defaultLimitLabel =
    limitLabel ||
    (itemLabel === "leads"
      ? "Rows per page:"
      : `${itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)} per page:`);

  const pages = generatePageNumbers(page, totalPages);

  const startItem =
    total !== undefined && limit ? Math.min((page - 1) * limit + 1, total) : 1;
  const endItem =
    total !== undefined && limit ? Math.min(page * limit, total) : limit || 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between text-xs text-stone-600",
        className
      )}
    >
      {/* Left side: Rows per page selector with shadcn Select */}
      <div className="flex items-center gap-2.5">
        {onLimitChange && limit && pageSizeOptions && pageSizeOptions.length > 0 && (
          <>
            <span className="text-stone-500 font-medium whitespace-nowrap">
              {defaultLimitLabel}
            </span>
            <div className="w-[74px]">
              <Select
                value={String(limit)}
                onValueChange={(val: any) => onLimitChange(Number(val))}
                disabled={isLoading}
              >
                <SelectTrigger
                  size="sm"
                  className="h-8 w-full text-xs bg-paper border-stone-200 text-botanical-900 font-medium rounded-xl shadow-2xs hover:border-stone-300"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start" className="min-w-[74px]">
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      {/* Right side: Page count (moved to the right) & Navigation controls */}
      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3.5 sm:gap-4">
        {/* Page Count Info */}
        {total !== undefined && limit && variant === "range" ? (
          <span className="text-stone-500 text-xs whitespace-nowrap">
            {total > 0 ? (
              <>
                Showing <strong className="text-stone-800 font-semibold">{startItem}</strong>–
                <strong className="text-stone-800 font-semibold">{endItem}</strong> of{" "}
                <strong className="text-stone-800 font-semibold">{total}</strong> {itemLabel}
              </>
            ) : (
              `0 ${itemLabel}`
            )}
          </span>
        ) : (
          <span className="text-stone-500 text-xs whitespace-nowrap">
            Page <strong className="text-botanical-900 font-semibold">{page}</strong> of{" "}
            <strong className="text-botanical-900 font-semibold">{Math.max(1, totalPages)}</strong>
            {total !== undefined && (
              <span className="text-stone-400"> ({total} total {itemLabel})</span>
            )}
          </span>
        )}

        {/* Navigation Buttons */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={page <= 1 || isLoading}
              className="h-8 w-8 p-0 border-stone-200 cursor-pointer disabled:opacity-40"
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || isLoading}
              className="h-8 gap-1 px-2.5 border-stone-200 cursor-pointer disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Prev</span>
            </Button>

            {/* Page Number Pills */}
            <div className="flex items-center gap-1 px-1">
              {pages.map((p, idx) =>
                p === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-stone-400 select-none">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPageChange(p as number)}
                    disabled={isLoading}
                    className={cn(
                      "h-8 min-w-[32px] rounded-lg px-2 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50",
                      p === page
                        ? "bg-botanical-800 text-paper shadow-2xs font-bold"
                        : "text-stone-700 hover:bg-oatmeal-200/80 hover:text-botanical-900 border border-stone-200/60"
                    )}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
              className="h-8 gap-1 px-2.5 border-stone-200 cursor-pointer disabled:opacity-40"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={page >= totalPages || isLoading}
              className="h-8 w-8 p-0 border-stone-200 cursor-pointer disabled:opacity-40"
              title="Last Page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
