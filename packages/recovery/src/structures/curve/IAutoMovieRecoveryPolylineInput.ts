import type { IAutoMovieCurve64 } from "@automovie/engine/geometry/curve";

/**
 * Explicitly ordered physical observations for one named polynomial approximation.
 * The caller establishes feature correspondence, order, closure and corners before fitting.
 *
 * @evidence contracts/common.md#principled-implementation Ordered millimetre observations and declared closure/corners define the existing tangent-constrained fitting problem.
 * @evidence contracts/common.md#clear-and-simple-design One input separates feature semantics owned by the caller from numerical approximation owned by recovery.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source topology, inferred closure, anatomical identity or higher-degree curve is supplied as a cubic.
 * @evidence contracts/common.md#meaningful-documentation Members state ordering, millimetre units, physical phase, finite budgets and supported parameterization.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased input performs no fitting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller owns immutable observations during the synchronous operation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration owns no runtime resources.
 */
export interface IAutoMovieRecoveryPolylineInput {
  /** Stable semantic name retained by the fitted curve. */
  name: string;

  /** Borrowed ordered finite millimetre triples; closed paths omit the repeated endpoint. */
  pointsMm: readonly IAutoMovieCurve64.Vector[];

  /** True only when the caller has established a closing last-to-first edge. */
  closed: boolean;

  /** Observation indices with declared independent one-sided tangents. */
  corners: readonly number[];

  /** Positive full-polyline approximation tolerance, millimetres. */
  toleranceMm: number;

  /** Positive integer output-span budget; exhaustion returns no coefficient value. */
  maxSpans: number;

  /** Initial fitting weights; saved span widths remain physical arclength in millimetres. */
  parameterization: "chord" | "centripetal";
}
