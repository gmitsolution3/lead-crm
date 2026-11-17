export interface SearchGroup {
  groupId: string;
  query: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  leadId: string;
  groupId: string;
  searchQuery: string;
  source: string;
  name: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  whatsapp: string;
  remark: string;
  createdAt: string;
  updatedAt: string;
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

