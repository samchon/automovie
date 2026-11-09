import type { IAutoMovieCurve64 } from "@automovie/engine";

/**
 * Explicitly ordered physical observations for one named polynomial approximation.
 * The caller establishes feature correspondence, order, closure and corners before fitting.
 *
 * @evidence contracts/development/design.md#principled-representation Ordered millimetre observations and declared closure/corners define the existing tangent-constrained fitting problem.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One input separates feature semantics owned by the caller from numerical approximation owned by recovery.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source topology, inferred closure, anatomical identity or higher-degree curve is supplied as a cubic.
 * @evidence contracts/development/common.md#meaningful-documentation Members state ordering, millimetre units, physical phase, finite budgets and supported parameterization.
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
