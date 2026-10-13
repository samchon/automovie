/**
 * The current frame's availability for domain admission. Residency owns renderer replacement and recovery; this snapshot reports ready, starting or failed with the current cause, without promising how long recovery will take.
 *
 * @evidence contracts/common.md#principled-implementation Reports current admission-page ready/starting/failed availability and original waiting/failure cause from residency.
 * @evidence contracts/common.md#clear-and-simple-design Keeps page transport availability separate from document-specific numerical verdicts and source digest equality.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A ready state alone cannot admit a document or prove displayed-model/hardware validity; permanent failure is distinct from pending startup.
 * @evidence contracts/common.md#meaningful-documentation Documents reason null on ready and meaningful startup/failure cause, with correlation enforced by producers rather than the plain interface.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The snapshot performs no recovery; browser acquisition/replacement and bridge judgment belong to their actual owners.
 * @evidence contracts/performance.md#reuse-equivalent-work Admission reads live state on request/unavailable handling, not a cached startup status under the same document key.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The browser owner retains availability and any recovery task; this scalar snapshot acquires no page or retry timer.
 *
 * @author Samchon
 */
export interface IHumanViewerPageState {
  /** `ready`, `starting` or `failed`. */
  state: "ready" | "starting" | "failed";

  /** What it is waiting for, or why it failed; null when ready. */
  reason: string | null;
}
