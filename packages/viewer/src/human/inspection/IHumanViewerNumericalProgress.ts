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
 * @author Samchon
 */
export interface IHumanViewerNumericalProgress {
  /** Worker completion envelope, separate from a numerical model reply. */
  type: "progress";

  /** Request still awaited by this page. */
  id: number;

  /** Exact completed stage supplied by the product owner. */
  stage: string;

  /** Milliseconds from this request's start, including preparation. */
  elapsedMs: number;

  /** Milliseconds since its preceding actual completion, or request start. */
  stageMs: number;
}
