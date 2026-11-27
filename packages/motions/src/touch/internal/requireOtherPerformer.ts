import { HumanRefusal } from "../../law/HumanRefusal";

/*
 * Admit a distinct performer for a partner-only action.
 * Parameter subject: The performer taking the action.
 * Parameter partner: The requested other performer.
 * Parameter reason: The action-specific reason the roles cannot coincide.
 * When the roles name the same performer.
 */
export function requireOtherPerformer(
  subject: string,
  partner: string,
  reason: string,
): void {
  if (partner === subject)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "partner",
      value: partner,
      reason,
      fix: "name another performer as the partner",
    });
}
