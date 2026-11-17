import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/**
 * An analytic ellipse center in millimetres, two orthonormal direction axes and positive millimetre semiaxes; one turn is the complete parameter domain.
 *
 * @evidence contracts/development/design.md#principled-representation The center-plus-two-axis representation directly supports the analytic trigonometric evaluator.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The turn-only discriminant separates analytic ellipses from piecewise Bernstein records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Axes are supplied coefficients, not fitted display samples; runtime admission checks orthonormality.
 * @evidence contracts/development/common.md#meaningful-documentation Documents the physical semiaxes, direction axes and one-turn parameter chart.
 */
export interface IAutoMovieAnalyticOvalCurve64 {
  /** Closed representation tag selecting the actual coefficient evaluator and its units. */
  type: "analyticOval";

  /** Stable semantic course identifier carried into actual inspection and source attribution. */
  name: string;

  /** Declared closure topology; this flag alone is not a periodicity, regularity or nonintersection proof. */
  closed: true;

  /** Explicit spatial unit of the generated primitive; exact coordinates remain millimetres until display conversion. */
  unit: "mm";

  /** Unit of the independent curve parameter; interval widths and reported derivatives use this same chart. */
  phaseUnit: "turn";

  /** Centre in the owning spatial chart; exact primitives use millimetres. */
  center: Readonly<AutoMovieVector3Tuple>;

  /** First declared unit axis of the owning transverse chart. */
  u: Readonly<AutoMovieVector3Tuple>;

  /** Second declared unit axis of the owning transverse chart. */
  v: Readonly<AutoMovieVector3Tuple>;

  /** Positive ellipse semiaxis length along u, millimetres. */
  radiusU: number;

  /** Positive ellipse semiaxis length along v, millimetres. */
  radiusV: number;
}
