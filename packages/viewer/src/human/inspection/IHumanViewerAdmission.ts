/**
 * The page's verdict on one hand-written document at its current cache key.
 *
 * @evidence contracts/common.md#principled-implementation Separates an admitted, a refused and a not yet examined document instead of treating unknown as valid.
 * @evidence contracts/common.md#meaningful-documentation Names each state and when the reason is present.
 *
 * @evidence contracts/common.md#clear-and-simple-design One state and nullable reason represent owner admission, refusal and work still pending.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Pending is an explicit alternative and cannot silently acquire an admitted verdict.
 *
 * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Separates an admitted, a refused and a not yet examined document instead of treating unknown as valid.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Pending is an explicit alternative and cannot silently acquire an admitted verdict.
 *
 * @author Samchon
 */
export interface IHumanViewerAdmission {
  /**
   * `admitted`, `refused` with the owner's reason, or `pending` until the page has examined it.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Distinguishes actual admitted, refused and still-pending owner judgement; pending cannot become valid by transport availability.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Distinguishes actual admitted, refused and still-pending owner judgement; pending cannot become valid by transport availability.
   */
  state: "admitted" | "refused" | "pending";

  /**
   * The owner's refusal or why it is pending; null when admitted.
   *
   * @evidence requirements/agent-authoring/roles-and-authorities.md#agent-runtime-authority Preserves the original refusal or waiting cause, with null only for the admitted outcome.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-runtime-evidence-authority-invariant Preserves the original refusal or waiting cause, with null only for the admitted outcome.
   */
  reason: string | null;
}
