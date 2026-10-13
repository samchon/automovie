/**
 * The page's verdict on one hand-written document at its current cache key.
 *
 * @evidence contracts/common.md#principled-implementation Represents keyed document admission from an actual owner verdict or explicit transport-pending cause, preserving admitted/refused/pending distinctions.
 * @evidence contracts/common.md#clear-and-simple-design One state/reason pair is shared by catalogue rejection and page admission bookkeeping.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The plain interface does not enforce state/reason correlation; producers must supply null on admission and meaningful refusal/pending causes.
 * @evidence contracts/common.md#meaningful-documentation Documents owner judgment versus unavailable transport and explains null reason; neither admitted schema nor this record proves appearance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The value performs no judgment; the numerical domain and page bridge own document parsing and admission.
 * @evidence contracts/performance.md#reuse-equivalent-work createHumanViewerAdmission reuses a verdict only for equal document id and numerical key; the state label alone is not cache authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Verdict/waiting records retain encountered ids without pruning in their owner; this scalar record owns no worker or request.
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
