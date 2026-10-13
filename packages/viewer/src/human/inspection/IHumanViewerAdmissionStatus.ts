/**
 * Admission work the server is doing or waiting on, as `/health` reports it.
 *
 * Counts and waiting causes come from the admission owner. A pending transport is distinct from a numerical verdict and does not establish whole-job progress or recovery policy.
 *
 * @evidence contracts/common.md#principled-implementation Documents awaiting a frame are reported by name of their reason, so a bridge that never arrives is visible.
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 *
 * @evidence contracts/common.md#clear-and-simple-design In-flight count, waiting count and distinct waiting causes cover admission work without exposing the verdict owner's maps.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing frame remains visible in the waiting reasons rather than being replaced by a successful document count.
 *
 * @author Samchon
 */
export interface IHumanViewerAdmissionStatus {
  /** Admissions asked of the page and not yet answered. */
  asking: number;

  /**
   * Documents whose admission could not run, held pending until a frame announces itself.
   */
  waiting: number;

  /** The distinct reasons those documents wait for. */
  reasons: string[];
}
