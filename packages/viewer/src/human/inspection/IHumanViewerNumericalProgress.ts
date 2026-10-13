/**
 * One completed numerical owner boundary from the existing worker. Request
 * identity prevents a retired result from advancing another display. Timing
 * differences use only that worker's monotonic clock; stage intervals and
 * the cumulative duration are separate, overlapping readings.
 *
 * The worker identifies its actual completed numerical boundary and monotonic durations. Those timings are not an estimate of total planned work or remaining time.
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
