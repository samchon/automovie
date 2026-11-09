import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One C2 material rotation over a jointed axis, preserving its centreline and section planes.
 *
 * The base transported frame is unchanged through `from`. At `to`, remove the target `up` direction's component along the actual tangent and measure its signed angle from the base chart axis `u` towards `v`. Use the shortest angle in (-pi, pi], choosing positive pi for an antipodal target. Connect zero to that angle with the zero-first/second-derivative quintic Hermite, then carry the same constant rotation relative to the base frame beyond `to`. This is not repeated projection of a fixed world direction along the remaining course.
 *
 * Engine admission requires finite increasing stations with representable positive separation and a finite nonzero target whose projected length exceeds 1e-9 of its full length, the existing jointed-up conditioning policy. It rejects some finite nonparallel directions: limiting the projection condition number below 1e9 limits amplification of input/frame/dot-product error, without guaranteeing one absolute angle error. It is not an anatomical tolerance or an exact-parallel predicate. Stations use the jointed course's physical arclength; they are not an outline's normalized pole parameter. The caller owns the signed anatomical target.
 *
 * @evidence contracts/development/design.md#principled-representation A rotation within the existing normal plane preserves the centreline/tangent and uses zero endpoint first/second jets to join the unchanged and constantly rotated material frames C2.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two stations and one signed endpoint direction define the single requested transition.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No fixed anatomical angle, frame-axis swap, centreline fitting or whole-course initial-up adjustment is inferred.
 * @evidence contracts/development/common.md#meaningful-documentation States station units, signed-angle convention, projected target, C2 transition, continued transport and admission.
 */
export interface IAutoMovieConstructionAxisRoll {
  /** Transition start, metres of jointed course arclength from its first centre; finite. */
  from: number;

  /** Transition end in the same units; finite, strictly greater than from with finite separation. */
  to: number;

  /** Signed target for chart +u at to, in the construction's frame; direction only, unscaled. */
  up: IAutoMovieVector3;
}
