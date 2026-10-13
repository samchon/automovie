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
 * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Documents awaiting a frame are reported by name of their reason, so a bridge that never arrives is visible.
 * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot A missing frame remains visible in the waiting reasons rather than being replaced by a successful document count.
 *
 * @author Samchon
 */
export interface IHumanViewerAdmissionStatus {
  /**
   * Admissions asked of the page and not yet answered.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Reports owner admission requests actually awaiting their replies.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Reports owner admission requests actually awaiting their replies.
   */
  asking: number;

  /**
   * Documents whose admission could not run, held pending until a frame announces itself.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Counts documents that could not obtain a verdict and await a real frame readiness trigger.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Counts documents that could not obtain a verdict and await a real frame readiness trigger.
   */
  waiting: number;

  /**
   * The distinct reasons those documents wait for.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-failure-diagnostic Makes distinct infrastructure waiting causes observable without manufacturing numerical rejection.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-failure-observation Makes distinct infrastructure waiting causes observable without manufacturing numerical rejection.
   */
  reasons: string[];
}
