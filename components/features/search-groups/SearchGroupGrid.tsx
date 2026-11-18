"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { SearchGroup, Lead } from "@/types";
import { SearchGroupCard } from "./SearchGroupCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchGroupGridProps {
  groups: SearchGroup[];
  leads: Lead[];
  onSelectGroupQuery: (query: string) => void;
}

export function SearchGroupGrid({
  groups,
  leads,
  onSelectGroupQuery,
}: SearchGroupGridProps) {
  const [filterText, setFilterText] = useState("");

  // Map each group to its total leads and potential clients (no website)
  const { groupLeadCounts, groupPotentialCounts } = React.useMemo(() => {
    const counts: Record<string, number> = {};
    const potentials: Record<string, number> = {};

    leads.forEach((lead) => {
      const keys = [lead.groupId, lead.searchQuery].filter(Boolean);
      keys.forEach((key) => {
        counts[key] = (counts[key] || 0) + 1;
        if (!lead.website) {
          potentials[key] = (potentials[key] || 0) + 1;
        }
      });
    });

    return { groupLeadCounts: counts, groupPotentialCounts: potentials };
  }, [leads]);

  const filteredGroups = groups.filter(
    (g) =>
      g.query.toLowerCase().includes(filterText.toLowerCase()) ||
      g.groupId.toLowerCase().includes(filterText.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" as const },
    },
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Search Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-stone-200/90 bg-[#FCFBF8] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div>
          <h2 className="text-xl font-bold text-botanical-900">
            Search Groups
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Organized lead extraction queries executed from the browser extension
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
            <Input
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search groups..."
              className="h-9 pl-8 text-xs bg-oatmeal-100/60 border-stone-200"
            />
          </div>
        </div>
      </div>

      {/* Staggered Grid */}
      {filteredGroups.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-[#FCFBF8] p-12 text-center">
          <p className="text-base font-semibold text-botanical-900">
            No search groups found
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Try adjusting your query filter.
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredGroups.map((group) => {
            const count =
              groupLeadCounts[group.groupId] ||
              groupLeadCounts[group.query] ||
              leads.filter((l) => l.groupId === group.groupId || l.searchQuery === group.query).length;

            const potentialCount =
              groupPotentialCounts[group.groupId] ??
              groupPotentialCounts[group.query] ??
              leads.filter(
                (l) =>
                  (l.groupId === group.groupId || l.searchQuery === group.query) &&
                  !l.website
              ).length;

            return (
              <motion.div key={group.groupId} variants={itemVariants}>
                <SearchGroupCard
                  group={group}
                  leadCount={count}
                  potentialCount={potentialCount}
                  onFilterByGroup={onSelectGroupQuery}
                />
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
