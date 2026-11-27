import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/**
 * Shared sampled source ring read and refined before any contour surface
 * resolves. The caller's generic subtype retains source-knot ownership beyond
 * this view.
 */
export interface IAutoMoviePrepareContourBoundaries64Ring {
  /**
   * Stable generated ring identity used for local diagnostics and source
   * ownership during this loft invocation.
   */
  id: string;
  /**
   * Mutable cyclic boundary samples in millimetres. Refinement inserts
   * source-derived points into this same array; callers must share ring
   * identity across incident groups.
   */
  points: AutoMovieVector3Tuple[];
  /**
   * Declared signed material-boundary orientation used by interaction and slit
   * preparation.
   */
  winding: number;
  /**
   * Local reason this ring cannot participate in supported boundary
   * preparation. Absence permits refinement; presence propagates to its
   * incident group rather than fabricating geometry.
   */
  unsupported?: string;
}
