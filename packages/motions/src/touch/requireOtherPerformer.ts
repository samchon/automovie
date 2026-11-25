import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Admit a distinct performer for a partner-only action.
 *
 * @param subject The performer taking the action.
 * @param partner The requested other performer.
 * @param reason The action-specific reason the roles cannot coincide.
 * @throws {HumanRefusal} When the roles name the same performer.
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
