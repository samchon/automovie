/**
 * One completed numerical owner boundary from the existing worker. Request identity prevents a retired result from advancing another display. Timing differences use only that worker's monotonic clock; stage intervals and cumulative duration overlap and do not estimate total planned work or remaining time.
 *
 * @evidence contracts/common.md#principled-implementation Reports an actual completed owner boundary for one correlated numerical request using that worker's monotonic clock.
 * @evidence contracts/common.md#clear-and-simple-design Separates stage interval from cumulative request elapsed duration and model replies so overlapping timings are not added as independent work.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retired/unknown request ids cannot advance a later display, and stage timings supply no planned-work denominator or ETA.
 * @evidence contracts/common.md#meaningful-documentation Documents milliseconds from preparation-inclusive request start and since preceding completion, with original stage identity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Progress projection uses fixed timestamp subtraction per observed boundary; actual numerical workload remains with the product owner.
 * @evidence contracts/performance.md#reuse-equivalent-work Current correlated requests share their own worker clock only; another request's interval or page wall-clock observation is not equivalent measurement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The transport forwards pending-request progress without a history collection; request maps retire on actual reply/failure and the payload owns no model.
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
