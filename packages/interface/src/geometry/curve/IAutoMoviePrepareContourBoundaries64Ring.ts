import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/**
 * Shared sampled source ring read and refined before any contour surface resolves.
 * The caller's generic subtype retains source-knot ownership beyond this view.
 *
 * @evidence contracts/development/design.md#principled-representation Cyclic millimetre samples carry declared winding and a stable identity; source-knot callbacks maintain generating-phase ownership.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Boundary preparation passes the same ring objects through interaction refinement and slit preparation for every incident group.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unsupported rings remain addressable and invalidate incident work; refinement inserts source-derived points rather than proxy chord positions.
 * @evidence contracts/development/common.md#meaningful-documentation Defines shared point-array mutation, millimetre frame, winding and local refusal propagation.
 */
export interface IAutoMoviePrepareContourBoundaries64Ring {
  /** Stable generated ring identity used for local diagnostics and source ownership during this loft invocation. */
  id: string;
  /** Mutable cyclic boundary samples in millimetres. Refinement inserts source-derived points into this same array; callers must share ring identity across incident groups. */
  points: AutoMovieVector3Tuple[];
  /** Declared signed material-boundary orientation used by interaction and slit preparation. */
  winding: number;
  /** Local reason this ring cannot participate in supported boundary preparation. Absence permits refinement; presence propagates to its incident group rather than fabricating geometry. */
  unsupported?: string;
}
