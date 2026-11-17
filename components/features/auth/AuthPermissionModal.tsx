"use client";

import React from "react";
import { ShieldAlert, ArrowRight, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AuthPermissionModalProps {
  open: boolean;
  onClose: () => void;
  requiredRole?: "admin";
  currentRole?: string;
  actionTitle?: string;
  onElevateRole?: () => void;
}

export function AuthPermissionModal({
  open,
  onClose,
  requiredRole = "admin",
  currentRole = "user",
  actionTitle = "perform this action",
  onElevateRole,
}: AuthPermissionModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-3xl border border-terracotta-200 bg-[#FCFBF8] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-terracotta-100 text-terracotta-700 shadow-inner">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-botanical-900">
                Authorization Required
              </h3>
              <Badge variant="terracotta" className="text-[10px] uppercase font-semibold">
                RBAC Gate
              </Badge>
            </div>
            <p className="text-xs text-stone-500">Better Auth Role Enforcement</p>
          </div>
        </div>

        <div className="rounded-2xl bg-oatmeal-100/70 p-4 border border-stone-200/70 text-xs text-stone-700 space-y-2 mb-5">
          <p className="leading-relaxed">
            You do not have permission to <strong className="text-botanical-900">{actionTitle}</strong>.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 text-[11px]">
            <span className="text-stone-500">Current Role:</span>
            <Badge variant="sage" className="capitalize text-[10px]">
              {currentRole || "Member"}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-stone-500">Required Role:</span>
            <Badge variant="terracotta" className="capitalize text-[10px]">
              {requiredRole.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          {onElevateRole && (
            <Button
              onClick={() => {
                onElevateRole();
                onClose();
              }}
              className="flex-1 bg-botanical-700 hover:bg-botanical-800 text-paper text-xs rounded-xl h-9.5 gap-1.5 cursor-pointer font-medium"
            >
              <ShieldCheck className="h-4 w-4 text-sage-200" />
              <span>Elevate to Admin Role</span>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-stone-200 text-xs h-9.5 cursor-pointer"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
