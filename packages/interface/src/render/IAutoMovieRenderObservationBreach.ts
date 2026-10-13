import { AutoMovieRenderMetric } from "./AutoMovieRenderMetric";

/**
 * One observed metric that exceeds its preflight inventory bound.
 *
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
