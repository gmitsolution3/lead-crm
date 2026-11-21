"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  title: string;
  description?: string;
  action?:
    | {
        label: string;
        onClick: () => void;
        variant?: "default" | "outline" | "secondary" | "ghost";
        icon?: React.ComponentType<{ className?: string }>;
      }
    | React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) return null;

    if (React.isValidElement(icon)) {
      return icon;
    }

    const IconComponent = icon as React.ComponentType<{ className?: string }>;
    return <IconComponent className="h-6 w-6 text-botanical-700" />;
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-stone-200/90 bg-[#FCFBF8] transition-all",
        compact ? "p-6 sm:p-8" : "p-10 sm:p-14",
        className
      )}
    >
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-oatmeal-200/70 border border-stone-200/80 shadow-xs mb-4">
          {renderIcon()}
        </div>
      )}

      <h3 className="font-serif text-base sm:text-lg font-bold tracking-tight text-botanical-900">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-stone-500 leading-relaxed">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {action &&
            (React.isValidElement(action) ? (
              action
            ) : typeof action === "object" && "label" in action ? (
              <Button
                variant={action.variant || "outline"}
                size="sm"
                onClick={action.onClick}
                className="text-xs h-9 rounded-xl border-stone-300 text-botanical-900 hover:bg-oatmeal-200/60 cursor-pointer gap-1.5"
              >
                {action.icon && (
                  <action.icon className="h-3.5 w-3.5 text-sage-600" />
                )}
                <span>{action.label}</span>
              </Button>
            ) : null)}

          {secondaryAction}
        </div>
      )}
    </div>
  );
}
