"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Lead, LeadNote } from "@/types";
import { useSession } from "@/lib/auth-client";
import { usePost, useDelete, usePatch } from "@/hooks";
import { formatDate } from "@/lib/utils";
import {
  MessageSquare,
  Clock,
  Send,
  Trash2,
  PhoneCall,
  User,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
} from "lucide-react";

interface LeadNotesModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated?: (updatedLead: Lead) => void;
}

export function LeadNotesModal({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
}: LeadNotesModalProps) {
  const { data: session } = useSession();
  const [newNoteContent, setNewNoteContent] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const endpoint = `/leads/${lead?.leadId || ""}/notes`;

  // Hooks for adding and deleting notes
  const { mutateAsync: addNoteMutation, isPending: isAdding } = usePost(
    endpoint,
    {
      invalidateQueries: [["/leads"], ["/search-groups"]],
    }
  );

  const { mutateAsync: deleteNoteMutation, isPending: isDeleting } = useDelete(
    endpoint,
    {
      invalidateQueries: [["/leads"], ["/search-groups"]],
    }
  );

  if (!lead) return null;

  const notes: LeadNote[] = lead.notes || [];

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    setErrorMsg(null);

    try {
      const payload = {
        content: newNoteContent.trim(),
        groupId: lead.groupId,
        createdBy: session?.user
          ? {
              userId: session.user.id,
              name: session.user.name,
              email: session.user.email,
            }
          : undefined,
      };

      const res = await addNoteMutation(payload);
      const updatedLead = res?.data || res;
      if (updatedLead && typeof updatedLead === "object" && updatedLead.notes) {
        onLeadUpdated?.(updatedLead);
      }
      setNewNoteContent("");
    } catch (err: any) {
      console.error("Failed to add activity note:", err);
      setErrorMsg(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to post note. Please try again."
      );
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    setErrorMsg(null);
    try {
      const res = await deleteNoteMutation(noteId);
      const updatedLead = res?.data || res;
      if (updatedLead && typeof updatedLead === "object" && updatedLead.notes) {
        onLeadUpdated?.(updatedLead);
      } else {
        const filtered = (lead.notes || []).filter((n) => n.noteId !== noteId);
        onLeadUpdated?.({ ...lead, notes: filtered });
      }
    } catch (err: any) {
      console.error("Failed to delete note:", err);
      setErrorMsg(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete note."
      );
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto bg-[#FCFBF8] border-l border-stone-200/90 p-6 sm:p-8 text-stone-800 shadow-2xl flex flex-col"
      >
        <SheetHeader className="pb-4 border-b border-stone-200 text-left shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-botanical-100 text-botanical-800">
              <MessageSquare className="h-4 w-4 text-botanical-700" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-botanical-700">
              Activity & Notes Log
            </span>
          </div>
          <SheetTitle className="text-2xl font-bold text-botanical-900 tracking-tight">
            Outreach Notes Timeline
          </SheetTitle>
          <SheetDescription className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
            <Layers className="h-3.5 w-3.5 text-stone-400" />
            <span className="font-semibold text-stone-700">{lead.name}</span>
            <span>•</span>
            <span className="italic truncate">&ldquo;{lead.searchQuery}&rdquo;</span>
          </SheetDescription>
        </SheetHeader>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-terracotta-50 border border-terracotta-200 text-xs text-terracotta-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-terracotta-600 mt-0.5" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        {/* Automatic Call Activity Bar */}
        <div className="mt-4 p-3 rounded-xl border border-stone-200 bg-paper flex items-center justify-between shadow-2xs shrink-0 text-xs">
          <div className="flex items-center gap-2 text-stone-600">
            <PhoneCall className="h-4 w-4 text-botanical-600" />
            <span>Calls Placed:</span>
            <span className="font-bold text-botanical-900 bg-oatmeal-100 px-2 py-0.5 rounded border border-stone-200">
              {lead.callCount || 0}
            </span>
            {lead.lastContactedAt && (
              <span className="text-[11px] text-stone-400 ml-1 hidden sm:inline">
                (Last: {formatDate(lead.lastContactedAt)})
              </span>
            )}
          </div>
          <span className="text-[11px] text-stone-400 italic">
            Increments automatically when a note is posted
          </span>
        </div>

        {/* Add Note Input Area */}
        <form onSubmit={handleAddNote} className="mt-4 space-y-2 shrink-0">
          <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-botanical-600" />
            <span>Add New Activity / Conversation Note</span>
          </label>
          <Textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            rows={3}
            placeholder="Log call summary, client feedback, objections, or deal agreements..."
            className="w-full bg-paper border-stone-300 text-xs"
          />
          <div className="flex justify-between items-center pt-1">
            <span className="text-[11px] text-stone-400">
              Posting as: <strong className="text-stone-600">{session?.user?.name || "Agent"}</strong>
            </span>
            <Button
              type="submit"
              disabled={!newNoteContent.trim() || isAdding}
              className="bg-botanical-800 hover:bg-botanical-900 text-white text-xs h-8.5 px-4 rounded-xl shadow-xs gap-1.5 font-semibold cursor-pointer"
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-sage-200" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="h-3 w-3" />
                  <span>Post Activity Note</span>
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Notes Activity Timeline */}
        <div className="mt-6 flex-1 flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-botanical-900">
              Chronological Timeline ({notes.length})
            </h4>
            <span className="text-[11px] text-stone-400">Newest first</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {notes.length === 0 ? (
              <div className="text-center py-10 bg-oatmeal-100/40 rounded-xl border border-dashed border-stone-200 text-xs text-stone-400">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 text-stone-300" />
                <p>No activity notes logged yet for this lead.</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Use the box above to log your first outreach touchpoint!
                </p>
              </div>
            ) : (
              [...notes].reverse().map((note) => (
                <div
                  key={note.noteId}
                  className="rounded-xl border border-stone-200/90 bg-paper p-3.5 text-xs space-y-1.5 shadow-2xs group hover:border-sage-300 transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-botanical-100 text-botanical-800 font-bold text-[10px]">
                        {note.createdBy?.name ? note.createdBy.name.charAt(0).toUpperCase() : "A"}
                      </span>
                      <span className="font-semibold text-botanical-900">
                        {note.createdBy?.name || "Team Member"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-stone-400" />
                        {formatDate(note.createdAt)}
                      </span>
                      <button
                        onClick={() => handleDeleteNote(note.noteId)}
                        disabled={isDeleting}
                        className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-terracotta-700 transition-opacity cursor-pointer p-0.5"
                        title="Delete note"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-stone-700 whitespace-pre-wrap leading-relaxed pl-6">
                    {note.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-stone-200 flex justify-end shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-stone-300 text-stone-700 hover:bg-stone-100 text-xs h-9 px-4 rounded-xl cursor-pointer"
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
