"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { mockLeads, mockSearchGroups } from "@/lib/mock-data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Sliders,
  Shield,
  Key,
  Bell,
  Database,
  Globe,
  Save,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Zap,
  Lock,
  Clock,
  Laptop,
} from "lucide-react";

interface SettingsDashboardProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role?: string;
    phone?: string;
  };
}

export default function SettingsDashboard({ user }: SettingsDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>("settings");
  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [activeSection, setActiveSection] = useState<
    "general" | "extension" | "security" | "notifications"
  >("general");

  const [copiedKey, setCopiedKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states (dummy controls)
  const [workspaceName, setWorkspaceName] = useState("Verdant Leads HQ");
  const [timezone, setTimezone] = useState("UTC+06:00 (Dhaka / Astana)");
  const [extensionApiKey, setExtensionApiKey] = useState(
    "vdt_live_84f93c019d42eb78a1bc8942e8d3fa"
  );
  const [autoEnrichment, setAutoEnrichment] = useState(true);
  const [dailyScrapeLimit, setDailyScrapeLimit] = useState("500");
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState("168");
  const [webhookUrl, setWebhookUrl] = useState(
    "https://api.verdantleads.local/v1/webhook"
  );
  const [leadAlerts, setLeadAlerts] = useState(true);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(extensionApiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRegenerateKey = () => {
    const newKey = `vdt_live_${Math.random().toString(36).substring(2, 12)}${Date.now().toString(36)}`;
    setExtensionApiKey(newKey);
    alert("New extension sync key generated! Remember to update your Chrome extension settings.");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchQuery={globalSearch}
      onSearchChange={setGlobalSearch}
      totalLeadsCount={mockLeads.length}
      totalGroupsCount={mockSearchGroups.length}
    >
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                System Administration
              </span>
              <span className="h-1 w-1 rounded-full bg-stone-300" />
              <Badge variant="sage" className="text-[10px]">
                Admin Console
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-botanical-900">
              Workspace Settings
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Manage your browser scraper integration, API credentials, security policies, and workspace preferences.
            </p>
          </div>

          <Button
            onClick={handleSave}
            className="bg-botanical-700 hover:bg-botanical-800 text-paper rounded-xl gap-2 text-xs h-10 px-4 shadow-sm cursor-pointer self-start sm:self-auto font-medium"
          >
            {saveSuccess ? (
              <>
                <Check className="h-4 w-4 text-emerald-300" />
                <span>Preferences Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 text-sage-300" />
                <span>Save All Changes</span>
              </>
            )}
          </Button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200/90 pb-3 overflow-x-auto">
          {[
            { id: "general", label: "General & Workspace", icon: Sliders },
            { id: "extension", label: "Extension & Crawler", icon: Key },
            { id: "security", label: "Security & Access", icon: Shield },
            { id: "notifications", label: "Webhooks & Alerts", icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-botanical-700 text-paper shadow-sm"
                    : "text-stone-600 hover:bg-oatmeal-200/70 hover:text-botanical-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-sage-200" : "text-stone-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* SECTION 1: GENERAL & WORKSPACE */}
        {activeSection === "general" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 border-stone-200 bg-[#FCFBF8] shadow-sm">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base font-bold text-botanical-900 flex items-center gap-2">
                  <Laptop className="h-4.5 w-4.5 text-botanical-700" />
                  <span>Workspace Information</span>
                </CardTitle>
                <p className="text-xs text-stone-500">
                  Primary branding and localization configurations
                </p>
              </CardHeader>

              <CardContent className="p-0 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700">Workspace Display Name</label>
                  <Input
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="bg-[#FCFBF8] border-stone-200 text-xs rounded-xl h-9.5"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700">Operating Timezone</label>
                  <Input
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="bg-[#FCFBF8] border-stone-200 text-xs rounded-xl h-9.5"
                  />
                  <p className="text-[11px] text-stone-400">Timestamps on extracted leads will align to this timezone.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700">Default Currency & Budget</label>
                  <Input
                    defaultValue="USD ($) - United States Dollar"
                    disabled
                    className="bg-oatmeal-100/70 border-stone-200 text-xs rounded-xl h-9.5 text-stone-500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 border-stone-200 bg-[#FCFBF8] shadow-sm">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base font-bold text-botanical-900 flex items-center gap-2">
                  <Globe className="h-4.5 w-4.5 text-terracotta-600" />
                  <span>Theme & Environment</span>
                </CardTitle>
                <p className="text-xs text-stone-500">
                  Visual theme and layout settings
                </p>
              </CardHeader>

              <CardContent className="p-0 space-y-4">
                <div className="rounded-xl border border-stone-200/80 bg-oatmeal-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-botanical-900">Warm Earth & Botanical Theme</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">Active palette: Clay (#F5F2ED), Paper (#FCFBF8), Botanical (#2C4A3E)</p>
                    </div>
                    <Badge variant="terracotta" className="text-[10px]">Active</Badge>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="h-5 w-5 rounded-full bg-[#2C4A3E] border border-white shadow-xs" title="Botanical 700" />
                    <span className="h-5 w-5 rounded-full bg-[#8FA392] border border-white shadow-xs" title="Sage 400" />
                    <span className="h-5 w-5 rounded-full bg-[#C58043] border border-white shadow-xs" title="Terracotta 500" />
                    <span className="h-5 w-5 rounded-full bg-[#F5F2ED] border border-stone-300 shadow-xs" title="Clay 100" />
                    <span className="h-5 w-5 rounded-full bg-[#FCFBF8] border border-stone-300 shadow-xs" title="Paper" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700">Typography Standard</label>
                  <p className="text-xs text-stone-600 font-medium">Poppins (Clean Sans-Serif)</p>
                  <p className="text-[11px] text-stone-400">Strict application-wide font without serif or monospaced fallbacks.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SECTION 2: EXTENSION & CRAWLER */}
        {activeSection === "extension" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 border-stone-200 bg-[#FCFBF8] shadow-sm md:col-span-2">
              <CardHeader className="p-0 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-botanical-900 flex items-center gap-2">
                    <Key className="h-4.5 w-4.5 text-botanical-700" />
                    <span>Browser Extension Sync Token</span>
                  </CardTitle>
                  <Badge variant="sage" className="text-[10px]">Encrypted TLS 1.3</Badge>
                </div>
                <p className="text-xs text-stone-500">
                  Paste this token inside your Chrome extension pop-up to sync real-time scraped Google Maps & social leads.
                </p>
              </CardHeader>

              <CardContent className="p-0 space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={extensionApiKey}
                    className="font-mono text-xs bg-oatmeal-100/60 border-stone-200 h-10 rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyKey}
                    className="gap-1.5 text-xs h-10 px-3.5 border-stone-300 rounded-xl cursor-pointer"
                  >
                    {copiedKey ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-stone-500" />}
                    <span>{copiedKey ? "Copied" : "Copy"}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRegenerateKey}
                    className="gap-1.5 text-xs h-10 px-3.5 border-stone-300 rounded-xl cursor-pointer hover:bg-terracotta-50 hover:text-terracotta-700 hover:border-terracotta-200"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Regenerate</span>
                  </Button>
                </div>

                <div className="rounded-xl bg-sage-50/70 border border-sage-200/80 p-3.5 text-xs text-stone-600 flex items-start gap-2.5">
                  <Zap className="h-4 w-4 text-botanical-700 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Token is bound to <strong>{user?.email || "admin account"}</strong>. When scraping on Google Maps or Instagram, the extension encrypts lead payloads with this token.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 border-stone-200 bg-[#FCFBF8] shadow-sm">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base font-bold text-botanical-900 flex items-center gap-2">
                  <Sparkles className="h-4.5 w-4.5 text-terracotta-500" />
                  <span>AI Extraction & Enrichment</span>
                </CardTitle>
                <p className="text-xs text-stone-500">Autonomous metadata and social handle crawling</p>
              </CardHeader>

              <CardContent className="p-0 space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200/80 bg-oatmeal-50">
                  <div>
                    <h4 className="text-xs font-semibold text-botanical-900">Auto-Enrich Incoming Leads</h4>
                    <p className="text-[11px] text-stone-500">Find Instagram, WhatsApp, and email addresses automatically upon capture.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoEnrichment}
                    onChange={(e) => setAutoEnrichment(e.target.checked)}
                    className="h-4 w-4 accent-botanical-700 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700">Max Daily Leads Cap</label>
                  <Input
                    type="number"
                    value={dailyScrapeLimit}
                    onChange={(e) => setDailyScrapeLimit(e.target.value)}
                    className="bg-[#FCFBF8] border-stone-200 text-xs rounded-xl h-9.5"
                  />
                  <p className="text-[11px] text-stone-400">Protects browser memory and avoids scraping rate limit flags.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 border-stone-200 bg-[#FCFBF8] shadow-sm">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base font-bold text-botanical-900 flex items-center gap-2">
                  <Database className="h-4.5 w-4.5 text-botanical-700" />
                  <span>Storage & Retention</span>
                </CardTitle>
                <p className="text-xs text-stone-500">MongoDB Atlas storage lifecycle</p>
              </CardHeader>

              <CardContent className="p-0 space-y-3 text-xs text-stone-600">
                <div className="flex items-center justify-between py-2 border-b border-stone-200/70">
                  <span>Database Cluster</span>
                  <span className="font-semibold text-botanical-900">gm-lead-generator-clust</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-stone-200/70">
                  <span>Database Driver</span>
                  <Badge variant="sage" className="text-[10px]">MongoDB 7.9 Native</Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Lead Retention Policy</span>
                  <span className="font-medium text-stone-700">Indefinite (No Auto-Purge)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SECTION 3: SECURITY & ACCESS */}
        {activeSection === "security" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 border-stone-200 bg-[#FCFBF8] shadow-sm">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base font-bold text-botanical-900 flex items-center gap-2">
                  <Lock className="h-4.5 w-4.5 text-botanical-700" />
                  <span>Authentication Rules</span>
                </CardTitle>
                <p className="text-xs text-stone-500">Better Auth security policies and role controls</p>
              </CardHeader>

              <CardContent className="p-0 space-y-4">
                <div className="rounded-xl border border-stone-200/80 bg-oatmeal-50 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-botanical-900">Single Role Gate</span>
                    <Badge variant="terracotta" className="text-[10px]">Enforced</Badge>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Only users promoted to <code>admin</code> by an existing administrator can acquire an active session. Unapproved users remain in pending status.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700">Session Inactivity Timeout (Hours)</label>
                  <Input
                    type="number"
                    value={sessionTimeoutHours}
                    onChange={(e) => setSessionTimeoutHours(e.target.value)}
                    className="bg-[#FCFBF8] border-stone-200 text-xs rounded-xl h-9.5"
                  />
                  <p className="text-[11px] text-stone-400">Default is 168 hours (7 days) with sliding renewal.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 border-stone-200 bg-[#FCFBF8] shadow-sm">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base font-bold text-botanical-900 flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-terracotta-600" />
                  <span>Audit Logs & Self-Protection</span>
                </CardTitle>
                <p className="text-xs text-stone-500">Guards against admin lockouts</p>
              </CardHeader>

              <CardContent className="p-0 space-y-3 text-xs text-stone-600">
                <div className="p-3 rounded-xl border border-emerald-200/90 bg-emerald-50/70 text-emerald-950">
                  <h4 className="font-bold text-xs">Self-Protection Safeguard Active</h4>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Admins are prohibited from demoting, banning, or deleting their own active user ID.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-stone-200 bg-oatmeal-50 text-stone-700">
                  <h4 className="font-bold text-xs">Immediate Session Invalidation</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Banning or deleting a user instantly destroys all active sessions in the MongoDB <code>session</code> collection.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SECTION 4: WEBHOOKS & NOTIFICATIONS */}
        {activeSection === "notifications" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 border-stone-200 bg-[#FCFBF8] shadow-sm md:col-span-2">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base font-bold text-botanical-900 flex items-center gap-2">
                  <Bell className="h-4.5 w-4.5 text-botanical-700" />
                  <span>Real-Time Lead Webhook</span>
                </CardTitle>
                <p className="text-xs text-stone-500">
                  Dispatch new lead captures to external CRM, Slack, or webhook automation
                </p>
              </CardHeader>

              <CardContent className="p-0 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-700">Outgoing Webhook Destination URL</label>
                  <Input
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="bg-[#FCFBF8] border-stone-200 text-xs rounded-xl h-9.5"
                  />
                  <p className="text-[11px] text-stone-400">Triggered automatically whenever an extension syncs newly captured contacts.</p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200/80 bg-oatmeal-50">
                  <div>
                    <h4 className="text-xs font-semibold text-botanical-900">Email Digest for Extracted Leads</h4>
                    <p className="text-[11px] text-stone-500">Receive a daily summary of newly scraped leads directly to {user?.email || "admin email"}.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={leadAlerts}
                    onChange={(e) => setLeadAlerts(e.target.checked)}
                    className="h-4 w-4 accent-botanical-700 cursor-pointer"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
