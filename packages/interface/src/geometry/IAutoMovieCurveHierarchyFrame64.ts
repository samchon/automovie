import type { AutoMovieMatrix3Tuple } from "./AutoMovieMatrix3Tuple";
import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/**
 * Named rigid frame with a parent key, translation in millimetres and three
 * proper rotation rows.
 *
 * Translation affects points. Rotation alone transforms derivative vectors and
 * preserves their physical units.
 */
export interface IAutoMovieCurveHierarchyFrame64 {
  /**
   * Unique nonempty hierarchy node key used to resolve transforms and edge
   * endpoints.
   */
  bone: string;

  /** Parent node key already declared during construction, or null for a root. */
  parent: string | null;

  /**
   * Dimensionless proper orthonormal rotation rows. Constructor inputs are
   * local-to-parent, and frame lookup returns the resolved local-to-world
   * rows.
   */
  rotation: AutoMovieMatrix3Tuple.ReadonlyRows;

  /**
   * Finite millimetre translation tuple. Constructor input is relative to the
   * parent and frame lookup reports world coordinates.
   */
  translationMm: Readonly<AutoMovieVector3Tuple>;
}
