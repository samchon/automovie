import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/**
 * Shared sampled source ring for pre-emission refinement. Keep the ring object
 * shared across its incident groups. Its caller-owned subtype can retain the
 * registered source knots.
 */
export interface IAutoMoviePrepareContourBoundaries64Ring {
  /**
   * Stable generated ring identity used for local diagnostics and source
   * ownership during this loft invocation.
   */
  id: string;
  /**
   * Mutable cyclic boundary samples in millimetres. Refinement splices
   * source-derived points into this same array and registers their knots.
   */
  points: AutoMovieVector3Tuple[];
  /**
   * Declared signed material-boundary orientation used by interaction and slit
   * preparation.
   */
  winding: number;
  /**
   * Reason to skip preparation of an incident group. Preparation copies it to
   * the group when no prior reason is present.
   */
  unsupported?: string;
}
