/**
 * One completed numerical owner boundary from the existing worker. Request
 * identity prevents a retired result from advancing another display. Timing
 * differences use only that worker's monotonic clock; stage intervals and
 * the cumulative duration are separate, overlapping readings.
 *
 * The worker identifies its actual completed numerical boundary and monotonic durations. Those timings are not an estimate of total planned work or remaining time.
 *
 * @evidence contracts/common.md#principled-implementation Carries actual owner completion and same-clock elapsed measurements without estimating remaining work.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the stage interval from cumulative time and request ownership.
 *
 * @evidence contracts/common.md#clear-and-simple-design One request id connects stage and cumulative same-clock timings to the build still awaited by the page.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A progress message contains completed work only, with no estimated completion percentage or age-based restart authority.
 *
 * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Carries actual owner completion and same-clock elapsed measurements without estimating remaining work.
 * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot A progress message contains completed work only, with no estimated completion percentage or age-based restart authority.
 *
 * @author Samchon
 */
export interface IHumanViewerNumericalProgress {
  /**
   * Worker completion envelope, separate from a numerical model reply.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Distinguishes actual stage completion telemetry from a completed numerical model reply.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Distinguishes actual stage completion telemetry from a completed numerical model reply.
   */
  type: "progress";

  /**
   * Request still awaited by this page.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Scopes the progress event to the request still awaited by the current page.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Scopes the progress event to the request still awaited by the current page.
   */
  id: number;

  /**
   * Exact completed stage supplied by the product owner.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Preserves the exact owner-completed stage rather than an estimated remaining-work label.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Preserves the exact owner-completed stage rather than an estimated remaining-work label.
   */
  stage: string;

  /**
   * Milliseconds from this request's start, including preparation.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Reports same-worker-clock milliseconds since request start, including preparation.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Reports same-worker-clock milliseconds since request start, including preparation.
   */
  elapsedMs: number;

  /**
   * Milliseconds since its preceding actual completion, or request start.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Reports same-worker-clock milliseconds since the preceding actual boundary separately from cumulative elapsed time.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Reports same-worker-clock milliseconds since the preceding actual boundary separately from cumulative elapsed time.
   */
  stageMs: number;
}
