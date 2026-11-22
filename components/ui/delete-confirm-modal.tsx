"use client";

import React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  itemName?: string;
  warningNote?: string;
  confirmText?: string;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  warningNote,
  confirmText = "Delete Permanently",
  isDeleting = false,
}: DeleteConfirmModalProps) {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0"
        />
        <DialogPrimitive.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#FCFBF8] p-6 text-stone-800 shadow-2xl border border-stone-200 duration-150 outline-none font-sans",
            "data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0"
          )}
        >
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 border border-rose-200">
              <Trash2 className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-base font-bold text-botanical-900 tracking-tight">
                {title}
              </DialogPrimitive.Title>

              <DialogPrimitive.Description className="mt-1.5 text-xs text-stone-600 leading-relaxed">
                {description}
              </DialogPrimitive.Description>

              {itemName && (
                <div className="mt-2.5 p-2 rounded-xl bg-oatmeal-100/70 border border-stone-200/70 text-xs font-semibold text-botanical-900 truncate">
                  &ldquo;{itemName}&rdquo;
                </div>
              )}

              {warningNote && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-[11px] text-rose-800 flex items-start gap-2 leading-tight">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600 mt-0.5" />
                  <span>{warningNote}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={onClose}
              className="text-xs h-9 px-4 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-100 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeleting}
              onClick={onConfirm}
              className="text-xs h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer gap-1.5 shadow-sm"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{confirmText}</span>
                </>
              )}
            </Button>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
