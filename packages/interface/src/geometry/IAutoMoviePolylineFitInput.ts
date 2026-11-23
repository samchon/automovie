import type { AutoMovieVector3Tuple } from "../index";

/**
 * Explicitly ordered physical observations for one named polynomial
 * approximation. The caller establishes feature correspondence, order, closure
 * and corners before fitting. RecoveryBezierFit.fit checks finite coordinates,
 * at least two open or three closed observations, noncollapsed adjacent edges,
 * corner indices and explicit positive work/tolerance limits. It throws on
 * invalid input or exhausted spans; observeAutoMovieRecoveryPolyline converts
 * that failure into its terminal result.
 */
export interface IAutoMoviePolylineFitInput {
  /** Stable semantic name retained by the fitted curve. */
  name: string;

  /**
   * Borrowed ordered finite millimetre triples; closed paths omit the repeated
   * endpoint.
   */
  pointsMm: readonly Readonly<AutoMovieVector3Tuple>[];

  /** True only when the caller has established a closing last-to-first edge. */
  closed: boolean;

  /** Observation indices with declared independent one-sided tangents. */
  corners: readonly number[];

  /** Positive full-polyline approximation tolerance, millimetres. */
  toleranceMm: number;

  /**
   * Positive safe-integer output-span budget; exhaustion throws from the fitter
   * without a coefficient result.
   */
  maxSpans: number;

  /**
   * Initial fitting weights; saved span widths remain physical arclength in
   * millimetres.
   */
  parameterization: "chord" | "centripetal";
}
