import { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";

/**
 * One observed metric that exceeds its preflight inventory bound.
 *
 * @evidence contracts/common.md#principled-implementation auditAutoMovieRenderObservation compares each finite non-negative observed metric with its unique report bound and emits a breach only when the actual frame exceeds that bound.
 * @evidence contracts/common.md#clear-and-simple-design Metric, bound and observed value explain one disagreement without embedding the complete report or choosing a new production limit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or duplicate report bounds and null observations remain unchecked rather than assumed agreement; drawing less is valid after culling and does not create a breach.
 * @evidence contracts/common.md#meaningful-documentation Defines report-bound versus actual renderer value and the strict-over-bound breach condition.
 * @author Samchon
 */
export interface IAutoMovieRenderObservationBreach {
  /** Metric whose observation exceeded its bound. */
  metric: AutoMovieRenderMetric;

  /**
   * Exact or conservative preflight estimate recorded as `finding.measured`.
   */
  bound: number;

  /** Renderer-observed value. */
  observed: number;
}
