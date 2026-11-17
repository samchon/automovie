/**
 * Result of inverting one local coordinate of an original native section.
 *
 * @evidence contracts/development/design.md#principled-representation An original polar phase identifies the unadjusted local point and its measured signed coordinate residual.
 * @evidence contracts/development/design.md#minimal-and-owned-surface NativeCoordinate.locate returns its admitted point and convergence observations to coordinate-based profile construction.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The inverse selects a declared monotone half; it does not fit or move the point to satisfy the requested coordinate.
 * @evidence contracts/development/common.md#meaningful-documentation Defines original-point ownership and the residual's role.
 */
export namespace IAutoMovieNativeCoordinate {
  /**
   * Fresh mutable result after native coordinate inversion admits its residual.
   * Endpoints can succeed with zero bisection queries. Other successful results
   * have at most 64 midpoint queries and a finite residual within
   * 32*Number.EPSILON*max(1, abs(target), absolute native extents) millimetres.
   * Unreachable targets or a failed residual check throw an admission error.
   *
   * @evidence contracts/development/design.md#principled-representation Phase and unmodified local point identify the actual source reading; residual and query count describe its numerical inverse.
   * @evidence contracts/development/design.md#minimal-and-owned-surface NativeCoordinate.locate retains the best actual point while counting all midpoint evaluations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The result reports finite numerical agreement, not an exact symbolic inverse or global monotonicity proof.
   * @evidence contracts/development/common.md#meaningful-documentation Gives radians, local millimetres, signed residual, query count and refusal behavior.
   */
  export interface IResult {
    /** Original polar radians in the selected half: component 1 uses [-pi/2,pi/2] or [pi/2,3pi/2]; component 0 uses [0,pi] or [pi,2pi]. */
    phase: number;

    /** Original [x,z] section-plane point in millimetres, never adjusted to the requested coordinate. */
    point: [number, number];

    /** Actual selected point component minus the requested target, in millimetres. */
    residual: number;

    /** Total midpoint point queries, excluding both explicit endpoints; not just the iteration that found the best point. */
    iterations: number;
  }
}
