import { LeadStatus } from "@/types";

export const ALLOWED_STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  uncontacted: ["called", "call_later", "interested", "not_interested", "invalid"],
  called: ["call_later", "interested", "not_interested", "converted", "invalid"],
  call_later: ["called", "interested", "not_interested", "converted", "invalid"],
  interested: ["call_later", "not_interested", "converted", "invalid"],
  not_interested: ["call_later", "interested", "invalid"],
  converted: ["not_interested"],
  invalid: ["uncontacted"],
};

export function isStatusTransitionAllowed(
  currentStatus?: LeadStatus | string,
  targetStatus?: LeadStatus | string
): boolean {
  if (!targetStatus) return true;
  const current = (currentStatus as LeadStatus) || "uncontacted";
  if (current === targetStatus) return true;
  const allowed = ALLOWED_STATUS_TRANSITIONS[current];
  if (!allowed) return true;
  return allowed.includes(targetStatus as LeadStatus);
}
