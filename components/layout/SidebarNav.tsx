"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavSection } from "./sidebar.config";

interface SidebarNavProps {
  sections: NavSection[];
  onCloseMobile?: () => void;
}

export function SidebarNav({ sections, onCloseMobile }: SidebarNavProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="mt-5 px-3 space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            {section.title}
          </div>
          <nav className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                    active
                      ? "bg-botanical-700 text-paper shadow-sm"
                      : "text-stone-700 hover:bg-oatmeal-200/70 hover:text-botanical-900"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-4.5 w-4.5 transition-colors",
                        active
                          ? "text-sage-200"
                          : "text-stone-400 group-hover:text-botanical-700"
                      )}
                    />
                    <span>{item.title}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );
}
