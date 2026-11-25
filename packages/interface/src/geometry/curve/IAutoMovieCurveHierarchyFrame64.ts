import type { AutoMovieMatrix3Tuple } from "../AutoMovieMatrix3Tuple";
import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/**
 * A named local-to-parent rigid frame: rotation rows and millimetre
 * translation. Parents must precede children when constructing the context;
 * null identifies a root.
 */
export interface IAutoMovieCurveHierarchyFrame64 {
  /**
   * Actual owning node key, resolved by the shared context before controls are
   * generated.
   */
  bone: string;

  /** Single parent node key, or null for the hierarchy root. */
  parent: string | null;

  /**
   * Dimensionless local-to-parent rotation rows; context admission requires a
   * proper orthonormal basis.
   */
  rotation: AutoMovieMatrix3Tuple.ReadonlyRows;

  /** Parent-relative translation in millimetres before resolving the hierarchy. */
  translationMm: Readonly<AutoMovieVector3Tuple>;
}
