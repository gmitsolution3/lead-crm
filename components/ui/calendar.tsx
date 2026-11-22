"use client";

import * as React from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "cn";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2 font-sans select-none", className)}
      classNames={{
        root: `${defaultClassNames.root} w-full`,
        months: "relative flex flex-col sm:flex-row gap-4",
        month: "space-y-3",
        month_caption: "flex justify-center items-center h-8 relative px-8",
        caption_label: "text-xs font-bold text-botanical-900 tracking-tight",
        nav: "flex items-center gap-1",
        button_previous: cn(
          "absolute left-1 top-0 h-7 w-7 rounded-lg border border-stone-200 bg-paper/90 text-stone-600 hover:text-botanical-900 hover:bg-oatmeal-200/80 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
        ),
        button_next: cn(
          "absolute right-1 top-0 h-7 w-7 rounded-lg border border-stone-200 bg-paper/90 text-stone-600 hover:text-botanical-900 hover:bg-oatmeal-200/80 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex justify-between border-b border-stone-100 pb-1 mb-1",
        weekday: "text-[10px] font-bold uppercase tracking-wider text-stone-400 w-8 text-center",
        week: "flex justify-between w-full mt-1",
        day: "h-8 w-8 text-center text-xs p-0 relative focus-within:relative focus-within:z-20",
        day_button: cn(
          "h-8 w-8 p-0 font-medium text-xs rounded-xl transition-all duration-150 flex items-center justify-center cursor-pointer outline-none",
          "hover:bg-oatmeal-200/70 hover:text-botanical-900 focus-visible:ring-2 focus-visible:ring-botanical-500"
        ),
        selected: cn(
          "bg-botanical-800! text-paper! font-bold! rounded-xl! shadow-sm shadow-botanical-900/20 hover:bg-botanical-900!"
        ),
        today: "font-bold text-botanical-900 bg-oatmeal-200/60 rounded-xl",
        outside: "text-stone-300 opacity-40 hover:opacity-80",
        disabled: "text-stone-300 opacity-30 cursor-not-allowed hover:bg-transparent hover:text-stone-300",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
