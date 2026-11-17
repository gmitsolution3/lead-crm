"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Compass, Percent, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

interface LeadMetricCardsProps {
  totalLeads: number;
  activeCampaigns: number;
  conversionRate: number;
}

export function LeadMetricCards({
  totalLeads,
  activeCampaigns,
  conversionRate,
}: LeadMetricCardsProps) {
  const metrics = [
    {
      title: "Total Leads Collected",
      value: totalLeads.toLocaleString(),
      subtitle: "+34 captured this week",
      trend: "+18.2%",
      trendPositive: true,
      icon: Users,
      accentColor: "text-botanical-700",
      bgAccent: "bg-sage-100",
      borderAccent: "border-b-4 border-b-botanical-600",
      description: "Aggregated across Google Maps, LinkedIn & Instagram scrapers",
    },
    {
      title: "Active Campaigns",
      value: activeCampaigns.toString(),
      subtitle: "6 query groups crawling",
      trend: "+2 new",
      trendPositive: true,
      icon: Compass,
      accentColor: "text-terracotta-600",
      bgAccent: "bg-terracotta-100",
      borderAccent: "border-b-4 border-b-terracotta-500",
      description: "Targeting Brooklyn cafes, Austin architects, UK skincare",
    },
    {
      title: "Conversion / Qualification Rate",
      value: `${conversionRate}%`,
      subtitle: "Verified phone & active email",
      trend: "+4.5%",
      trendPositive: true,
      icon: Percent,
      accentColor: "text-botanical-800",
      bgAccent: "bg-sage-200/80",
      borderAccent: "border-b-4 border-b-sage-500",
      description: "89% of leads contain at least 2 verified contact channels",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: "easeOut" as const },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-5 md:grid-cols-3"
    >
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.title}
            variants={itemVariants}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
          >
            <Card
              className={`relative overflow-hidden border border-stone-200/90 bg-[#FCFBF8] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${metric.borderAccent}`}
            >
              {/* Subtle top organic watermark */}
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-stone-100/40 pointer-events-none" />

              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    {metric.title}
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight text-botanical-900 md:text-4xl">
                      {metric.value}
                    </span>
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <TrendingUp className="mr-0.5 h-3 w-3" />
                      {metric.trend}
                    </span>
                  </div>
                </div>

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${metric.bgAccent} ${metric.accentColor} shadow-inner`}
                >
                  <Icon className="h-6 w-6" />
                </div>
              </div>

              {/* Earth-tone Divider */}
              <div className="my-4 h-px w-full bg-stone-200/80" />

              <div className="flex items-center justify-between text-xs text-stone-600">
                <span className="font-medium text-stone-700">
                  {metric.subtitle}
                </span>
                <span className="text-[11px] text-stone-400 truncate max-w-[140px] text-right">
                  Real-time sync
                </span>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
