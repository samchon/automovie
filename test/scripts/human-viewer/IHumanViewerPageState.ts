/**
 * Whether the server's page can admit documents now: ready, still starting
 * (it will become ready), or failed for good (its renderer exited or its
 * browser closed; only a viewer restart recovers).
 *
 * @evidence contracts/common.md#principled-implementation Separates a page that will become ready from one that never can, so waiting is decided by state rather than time.
 * @evidence contracts/common.md#meaningful-documentation Names each state and the reason member.
 * @author Samchon
 */
export interface IHumanViewerPageState {
  /** `ready`, `starting` or `failed`. */
  state: "ready" | "starting" | "failed";

  /** What it is waiting for, or why it failed; null when ready. */
  reason: string | null;
}
