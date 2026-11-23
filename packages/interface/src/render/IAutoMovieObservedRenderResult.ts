import type { IAutoMovieRenderObservation } from "./IAutoMovieRenderObservation.js";

/**
 * A synchronous drawing operation's unchanged result paired with measured
 * submission counters. observeAutoMovieRendererFrame aggregates calls/triangles
 * across all draws within one reset epoch; other dimensions remain null. Output
 * preserves the caller's exact return type without representing or abstracting
 * a renderer dependency.
 */
export interface IAutoMovieObservedRenderResult<Output> {
  /**
   * Exact unchanged synchronous draw callback result; ownership follows the
   * callback.
   */
  output: Output;
  /** Frame-wide submission counts; unavailable cost dimensions are null. */
  observed: IAutoMovieRenderObservation;
}
