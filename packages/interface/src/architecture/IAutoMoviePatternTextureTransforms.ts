import type { IAutoMoviePatternTextureSheet } from "./IAutoMoviePatternTextureSheet";
import type { IAutoMovieSurfacePatternResult } from "./IAutoMovieSurfacePatternResult";

/** One material sheet and tile size applied to generated pattern occurrences. */
export namespace IAutoMoviePatternTextureTransforms {
  /**
   * One material sheet and tile size applied to generated pattern occurrences.
   *
   * A pattern is not a texture repeat, but what a laid piece finally shows is
   * still a texture, and the way to show it is the one the material record
   * already has: an `offset`, a `scale`, and a `rotationDeg` on its texture
   * reference. Nothing new is invented here and no second texturing path is
   * opened; what this adds is the arithmetic that turns a piece's own place,
   * size, rotation, grain, and flip into that transform, so a book-matched pair
   * is a real mirrored image rather than two slabs a viewer cannot tell apart.
   *
   * The mesh UV this is applied to is a point's place inside the module
   * rectangle the occurrence was generated at, normalized: the binding this
   * fills in is a `"normalized"` coordinate source and not the
   * `"surface-metres"` one an atlas-bearing procedural surface emits, so a
   * prototype has to be a unit square by construction rather than by luck, and
   * the binding has to say which arithmetic it was written in. A whole piece
   * therefore spans `[0, 1]` on both axes, which is what a unit-square
   * prototype gives, and a cut piece spans the sub-rectangle the cut left it
   * rather than being renormalized over its own outline, because a renormalized
   * cut piece would show the whole image squeezed into the surviving sliver.
   * The sheet is turned by the piece's own
   * {@link IAutoMoviePatternPlacement.grainDeg}, so a board whose grain runs
   * along it samples straight while a slab set across the grain samples across
   * it.
   *
   * One call states one material's sheet. A run whose zones carry different
   * materials calls it once per material and keeps the occurrences belonging to
   * that material's zones, exactly as the prototype table is stated per call.
   *
   * At zero texture centre, the viewer/Three matrix is `diag(scale) ·
   * R(-rotationDeg) · uv + offset`: it rotates the UV column vector first, then
   * applies axis scales. Orthogonal rows admit this ideal factorization; the
   * implementation accepts their relative dot product within `1e-9` and reports
   * larger residual skew by occurrence id.
   *
   * Every placement of the run lands in exactly one of the two lists, in
   * placement order. Throws when a tile length is not a finite number above
   * zero or a face sheet's origin is not finite.
   */
  export type IProps = {
    /**
     * Borrowed placements in planar metres and degrees; one material sheet is
     * applied to all supplied rows.
     */
    result: IAutoMovieSurfacePatternResult;

    /** Metres one turn of the texture covers along its own two axes. */
    tile: IPropsTile;

    /** Where the sheet is pinned. */
    sheet: IAutoMoviePatternTextureSheet;
  };

  /** The tile object of {@link IProps}. */
  export type IPropsTile = {
    /** Metres one turn covers along the sheet's own U axis. */
    u: number;

    /** Metres one turn covers along the sheet's own V axis. */
    v: number;
  };
}
