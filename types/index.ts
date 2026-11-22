import type { auth } from "@/lib/auth";

export interface SearchGroup {
  id?: string;
  groupId: string;
  query: string;
  createdAt: string | number;
  updatedAt: string | number;
  leadCount?: number;
  potentialCount?: number;
  leads?: Lead[];
}

export type LeadStatus =
  | "uncontacted"
  | "called"
  | "call_later"
  | "interested"
  | "not_interested"
  | "converted"
  | "invalid";

export type LeadPriority = "low" | "medium" | "high";

export interface LeadUser {
  userId?: string;
  name?: string;
  email?: string;
}

export interface LeadNote {
  noteId: string;
  content: string;
  createdAt: number;
  createdBy?: LeadUser;
}

export interface Lead {
  id?: string;
  leadId: string;
  groupId: string;
  searchQuery: string;
  source: string;
  name: string;
  phone: string;
  email: string;
  website: string;
  address?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  whatsapp?: string;
  status?: LeadStatus;
  priority?: LeadPriority;
  followUpDate?: number | null;
  dealValue?: number;
  lastContactedAt?: number | null;
  callCount?: number;
  assignedTo?: LeadUser;
  lastContactedBy?: LeadUser;
  notes?: LeadNote[];
  createdAt: string | number;
  updatedAt: string | number;
}

export type LeadSource =
  | "Google Maps"
  | "Instagram"
  | "LinkedIn"
  | "Facebook"
  | "Website"
  | "Directory"
  | string;

export interface LeadMetrics {
  totalLeads: number;
  activeCampaigns: number;
  conversionRate: number;
  growthRate: number;
  enrichedPercentage: number;
}

export interface ActivityEvent {
  id: string;
  leadName: string;
  searchQuery: string;
  source: string;
  action: "captured" | "enriched" | "contacted" | "tagged";
  timestamp: string | number;
}

/**
 * Authoritative User and Session types inferred directly from Better Auth.
 * Includes all additionalFields (phone, imagePublicId) and plugin extensions (role, banned, etc.).
 */
export type User = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session.session;
