/**
 * The page's verdict on one hand-written document at its current cache key.
 *
 * @author Samchon
 */
export interface IHumanViewerAdmission {
  /**
   * `admitted`, `refused` with the owner's reason, or `pending` until the page has examined it.
   */
  state: "admitted" | "refused" | "pending";

  /** The owner's refusal or why it is pending; null when admitted. */
  reason: string | null;
}
