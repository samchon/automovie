/**
 * The page's verdict on one hand-written document at its current cache key.
 *
 * @evidence contracts/common.md#principled-implementation Separates an admitted, a refused and a not yet examined document instead of treating unknown as valid.
 * @evidence contracts/common.md#meaningful-documentation Names each state and when the reason is present.
 * @author Samchon
 */
export interface IHumanViewerAdmission {
  /** `admitted`, `refused` with the owner's reason, or `pending` until the page has examined it. */
  state: "admitted" | "refused" | "pending";

  /** The owner's refusal or why it is pending; null when admitted. */
  reason: string | null;
}
