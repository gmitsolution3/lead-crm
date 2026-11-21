"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LeadTable } from "@/components/features/leads/LeadTable";
import { SearchGroupGrid } from "@/components/features/search-groups/SearchGroupGrid";
import { useDashboard } from "@/context";
import { FolderKanban, Users, Sparkles } from "lucide-react";

interface LeadsDashboardProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role?: string;
    phone?: string;
    image?: string | null;
  };
}

export default function LeadsDashboard({ user }: LeadsDashboardProps) {
  const router = useRouter();
  const { leads, groups, openLeadDetail } = useDashboard();
  const [leadsSubView, setLeadsSubView] = useState<"groups" | "all">("groups");

  const handleSelectGroup = (queryOrId: string) => {
    router.push(`/leads/${encodeURIComponent(queryOrId)}`);
  };

  const potentialClientsCount = leads.filter((l) => !l.website).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-view Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Data Repository
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-botanical-900">
            Prospects &amp; Extracted Leads
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Browse leads categorized by search query groups or view the complete unified table.
          </p>
        </div>

        {/* Sub-view toggle & Quick Info */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {potentialClientsCount > 0 && (
            <span
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-terracotta-100 text-terracotta-900 border border-terracotta-200/90 shadow-2xs"
              title={`${potentialClientsCount} leads in your repository do not have a website (ideal outreach targets)`}
            >
              <Sparkles className="h-3.5 w-3.5 text-terracotta-600" />
              <span>{potentialClientsCount} Potential Clients (No Website)</span>
            </span>
          )}

          <div className="flex items-center rounded-xl bg-oatmeal-200/80 p-1 border border-stone-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setLeadsSubView("groups")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                leadsSubView === "groups"
                  ? "bg-paper text-botanical-900 shadow-sm"
                  : "text-stone-600 hover:text-botanical-900"
              }`}
            >
              <FolderKanban className="h-3.5 w-3.5" />
              <span>Search Groups ({groups.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setLeadsSubView("all")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                leadsSubView === "all"
                  ? "bg-paper text-botanical-900 shadow-sm"
                  : "text-stone-600 hover:text-botanical-900"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>All Leads ({leads.length})</span>
            </button>
          </div>
        </div>
      </div>

      {leadsSubView === "groups" ? (
        <SearchGroupGrid
          groups={groups}
          leads={leads}
          onSelectGroupQuery={handleSelectGroup}
        />
      ) : (
        <LeadTable
          leads={leads}
          onSelectLead={openLeadDetail}
        />
      )}
    </div>
  );
}
