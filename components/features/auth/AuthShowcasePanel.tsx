"use client";

import React from "react";
import {
  Sprout,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Mail,
  Phone,
  Globe,
  Database,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WhatsAppIcon, InstagramIcon } from "@/components/ui/icons";

export function AuthShowcasePanel() {
  return (
    <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between overflow-hidden bg-gradient-to-br from-botanical-800 via-botanical-900 to-[#14231C] p-10 text-paper shadow-2xl">
      {/* Organic Botanical Glowing Orbs */}
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-sage-400/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 h-80 w-80 rounded-full bg-terracotta-500/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-botanical-500/25 blur-3xl pointer-events-none" />

      {/* Top Brand Header */}
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-400/20 border border-sage-300/30 text-sage-200 shadow-sm backdrop-blur-md">
            <Sprout className="h-6 w-6 text-sage-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-paper">
                Verdant
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-terracotta-400">
                Leads
              </span>
            </div>
            <p className="text-xs text-sage-200/70">Organic Lead Generation CRM</p>
          </div>
        </div>

        <div className="mt-8 max-w-sm">
          <Badge
            variant="outline"
            className="border-sage-400/30 bg-sage-900/40 text-sage-200 text-[11px] gap-1.5 py-0.5 px-2.5 backdrop-blur-md"
          >
            <Sparkles className="h-3 w-3 text-terracotta-400" />
            <span>Warm Earth & Botanical Design</span>
          </Badge>
          <h2 className="mt-3 text-2xl font-bold leading-snug text-paper">
            From browser extension to verified sales pipelines in seconds.
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-sage-200/80">
            Intelligent scraping, real-time social enrichment, and multi-user role authorization backed by MongoDB.
          </p>
        </div>
      </div>

      {/* Center Interactive Lead Card Showcase */}
      <div className="relative z-10 my-8">
        <div className="relative rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-400/20 text-sage-200 font-bold text-xs border border-sage-300/20">
                VB
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-paper">Verdant Botanica Co.</h4>
                  <CheckCircle2 className="h-3.5 w-3.5 text-sage-400" />
                </div>
                <p className="text-[11px] text-sage-200/70">Brooklyn, New York</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              Verified 98%
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-sage-100/90 bg-black/20 p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 text-[11px]">
              <Mail className="h-3 w-3 text-sage-300 shrink-0" />
              <span className="truncate">contact@verdantbotanica.nyc</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <Phone className="h-3 w-3 text-sage-300 shrink-0" />
              <span>+1 (718) 555-0149</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <MapPin className="h-3 w-3 text-sage-300 shrink-0" />
              <span className="truncate">84 Franklin St, Brooklyn, NY</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-sage-200/70 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
                <WhatsAppIcon className="h-3 w-3" />
              </div>
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-terracotta-500/20 text-terracotta-300">
                <InstagramIcon className="h-3 w-3" />
              </div>
            </div>
            <span className="text-[10px] text-sage-300">Extension live sync</span>
          </div>
        </div>

        {/* Floating Mini Metric Badge */}
        <div className="absolute -bottom-4 -right-2 rounded-xl border border-terracotta-400/30 bg-terracotta-900/80 px-3.5 py-2 backdrop-blur-md shadow-lg flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-terracotta-400" />
          <div>
            <p className="text-[10px] font-semibold uppercase text-terracotta-200">Accuracy</p>
            <p className="text-xs font-bold text-paper">99.4% Verified</p>
          </div>
        </div>
      </div>

      {/* Bottom Infrastructure Badges */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-sage-200/80">
        <div className="flex items-center gap-2">
          <Database className="h-3.5 w-3.5 text-emerald-400" />
          <span>MongoDB Atlas Native</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-sage-300" />
          <span>Better Auth RBAC</span>
        </div>
      </div>
    </div>
  );
}
