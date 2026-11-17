import type { IAutoMovieConstructionProfile } from "./IAutoMovieConstructionProfile";

/**
 * Adaptive station/piece-coordinate grids for original profile tessellation.
 *
 * @evidence contracts/development/design.md#principled-representation Physical station marks and dimensionless piece marks retain original guides and omit declared collapsed rows.
 * @evidence contracts/development/design.md#minimal-and-owned-surface ProfileGrid creates these grids for ProfileBody's source face and shared-boundary publication.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Sampled chord refinement and endpoint checks do not prove continuous topology or an unsampled error bound.
 * @evidence contracts/development/common.md#meaningful-documentation Names chart units, omitted poles and the grid's downstream owner.
 */
export namespace IAutoMovieConstructionProfileGrid {
  /**
   * Tessellation marks of one actual loop; true collapsed rows stay separate from regular face grids.
   *
   * Arrays are freshly built and mutable; the loop is borrowed from the
   * prepared definition. ProfileBody retains station arrays and nonperiodic
   * phase arrays, so callers must not alter them after publication.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States units, inclusive endpoints, borrowed definition and mutable arrays retained by faces.
   * @evidence contracts/development/design.md#principled-representation A shared sorted station grid and one sorted normalized grid per piece preserve each source clock and its guides.
   * @evidence contracts/development/design.md#minimal-and-owned-surface ProfileBody consumes every station and piece entry to publish surfaces and common vertex IDs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts ProfileGrid checks finite points and sampled joining/collapse/chord criteria, refusing exhausted refinement; the type does not certify unsampled geometry.
   */
  export interface IGrid {
    /** Same copied declaration whose original functions were sampled. */
    loop: IAutoMovieConstructionProfile.ILoop;

    /** Strictly increasing regular station rows in millimetres; declared collapsed endpoints are omitted. */
    stations: number[];

    /** Piece IDs map to increasing coordinates including 0 and 1 and every declared guide; each array is mutable despite the readonly map view. */
    phases: ReadonlyMap<string, number[]>;
  }
}
