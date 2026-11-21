"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useFetch, usePatch } from "@/hooks";
import {
  mockLeads,
  mockSearchGroups,
  mockRecentActivities,
  ActivityEvent,
} from "@/lib/mock-data";
import { Lead, SearchGroup } from "@/types";

export interface DashboardContextType {
  // Data
  groups: SearchGroup[];
  leads: Lead[];
  activities: ActivityEvent[];
  totalLeadsCount: number;
  totalGroupsCount: number;
  isLoading: boolean;
  isFetching: boolean;

  // Sync / Refresh
  refetchData: () => Promise<void>;
  syncFeedback: string | null;
  setSyncFeedback: (msg: string | null) => void;

  // Centralized Lead Detail Sheet
  selectedLead: Lead | null;
  isSheetOpen: boolean;
  openLeadDetail: (lead: Lead) => void;
  closeLeadDetail: () => void;
  saveRemark: (leadId: string, newRemark: string) => Promise<void>;

  // Contextual Shell Controls
  selectedGroupQuery: string | null;
  setSelectedGroupQuery: (query: string | null) => void;
  exportLeadsHandler?: () => void;
  setExportLeadsHandler: (fn?: () => void) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Single SWR query for all search groups & leads
  const {
    data: searchGroupsData,
    isLoading,
    isFetching,
    refetch,
  } = useFetch<any>("/search-groups");

  // 2. Single SWR patch mutation for leads
  const { mutateAsync: patchLeadRemark } = usePatch("/leads", {
    invalidateQueries: [["/search-groups"], ["/leads"]],
  });

  // 3. Normalization of Search Groups
  const groups: SearchGroup[] = useMemo(() => {
    const rawGroups = searchGroupsData?.data || searchGroupsData;
    if (Array.isArray(rawGroups) && rawGroups.length > 0) {
      return rawGroups.map((g: any) => ({
        id: g.id || g._id || g.groupId,
        groupId: g.groupId || g.id,
        query: g.query,
        createdAt: g.createdAt || new Date().toISOString(),
        updatedAt: g.updatedAt || new Date().toISOString(),
        leads: Array.isArray(g.leads)
          ? g.leads.map((l: any) => ({
              id: l.id || l._id || l.leadId,
              leadId: l.leadId || l.id,
              groupId: g.groupId || g.id,
              name: l.name || "Unknown Company",
              phone: l.phone || null,
              email: l.email || null,
              website: l.website || null,
              facebook: l.facebook || null,
              instagram: l.instagram || null,
              linkedin: l.linkedin || null,
              whatsapp: l.whatsapp || null,
              address: l.address || "",
              searchQuery: g.query,
              source: l.source || "Google Maps",
              remark: l.remark || "",
              createdAt: l.createdAt || g.createdAt || new Date().toISOString(),
              updatedAt: l.updatedAt || g.updatedAt || new Date().toISOString(),
            }))
          : [],
      }));
    }
    return mockSearchGroups;
  }, [searchGroupsData]);

  // 4. Local optimistic remark overrides
  const [remarkOverrides, setRemarkOverrides] = useState<Record<string, string>>({});

  // 5. Normalized Leads list
  const leads: Lead[] = useMemo(() => {
    const extracted = groups.flatMap((g) => g.leads || []);
    const baseList = extracted.length > 0 ? extracted : mockLeads;
    if (Object.keys(remarkOverrides).length === 0) return baseList;
    return baseList.map((l) =>
      remarkOverrides[l.leadId] !== undefined
        ? { ...l, remark: remarkOverrides[l.leadId], updatedAt: new Date().toISOString() }
        : l
    );
  }, [groups, remarkOverrides]);

  // 6. Recent activities derived from captured leads
  const activities: ActivityEvent[] = useMemo(() => {
    if (leads.length > 0 && leads !== mockLeads) {
      return leads.slice(0, 10).map((l, i) => ({
        id: `act-${l.leadId || i}`,
        leadName: l.name,
        searchQuery: l.searchQuery,
        timestamp: l.createdAt,
        action: "captured",
        source: l.source,
      }));
    }
    return mockRecentActivities;
  }, [leads]);

  // 7. Toast feedback state
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // 8. Lead detail sheet state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const openLeadDetail = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setIsSheetOpen(true);
  }, []);

  const closeLeadDetail = useCallback(() => {
    setIsSheetOpen(false);
  }, []);

  // 9. Centralized remark saving
  const saveRemark = useCallback(
    async (leadId: string, newRemark: string) => {
      setRemarkOverrides((prev) => ({ ...prev, [leadId]: newRemark }));
      if (selectedLead && selectedLead.leadId === leadId) {
        setSelectedLead((prev) =>
          prev
            ? {
                ...prev,
                remark: newRemark,
                updatedAt: new Date().toISOString(),
              }
            : null
        );
      }

      try {
        await patchLeadRemark({
          id: `${encodeURIComponent(leadId)}/remark`,
          data: { remark: newRemark },
        });
        setSyncFeedback("Remark saved successfully!");
      } catch {
        setSyncFeedback("Local remark updated (Offline mode)");
      }
      setTimeout(() => setSyncFeedback(null), 3000);
    },
    [patchLeadRemark, selectedLead]
  );

  // 10. Centralized refresh
  const refetchData = useCallback(async () => {
    setSyncFeedback("Syncing with backend database...");
    try {
      await refetch();
      setSyncFeedback("Database sync complete!");
    } catch {
      setSyncFeedback("Failed to sync with backend database.");
    }
    setTimeout(() => setSyncFeedback(null), 3000);
  }, [refetch]);

  // 11. Header contextual states
  const [selectedGroupQuery, setSelectedGroupQuery] = useState<string | null>(null);
  const [exportLeadsHandler, setExportLeadsHandlerState] = useState<(() => void) | undefined>(undefined);

  const setExportLeadsHandler = useCallback((fn?: () => void) => {
    setExportLeadsHandlerState(() => fn);
  }, []);

  const value = useMemo(
    () => ({
      groups,
      leads,
      activities,
      totalLeadsCount: leads.length,
      totalGroupsCount: groups.length,
      isLoading,
      isFetching,
      refetchData,
      syncFeedback,
      setSyncFeedback,
      selectedLead,
      isSheetOpen,
      openLeadDetail,
      closeLeadDetail,
      saveRemark,
      selectedGroupQuery,
      setSelectedGroupQuery,
      exportLeadsHandler,
      setExportLeadsHandler,
    }),
    [
      groups,
      leads,
      activities,
      isLoading,
      isFetching,
      refetchData,
      syncFeedback,
      selectedLead,
      isSheetOpen,
      openLeadDetail,
      closeLeadDetail,
      saveRemark,
      selectedGroupQuery,
      exportLeadsHandler,
      setExportLeadsHandler,
    ]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextType {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
