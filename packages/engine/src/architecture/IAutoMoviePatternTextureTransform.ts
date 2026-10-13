/**
 * One occurrence's sampling of its material, in the PBR record's own UV
 * transform.
 *
 * Produced by `autoMoviePatternTextureTransforms` for the `"normalized"`
 * coordinate source, where a whole piece spans `[0, 1]` on both axes. The
 * renderer's texture matrix scales and then rotates; `offset` is in sheet
 * turns, `scale.x` is negative for a mirrored piece, and `rotationDeg` is the
 * rotation the record applies after that scale.
 *
 * @evidence contracts/common.md#principled-implementation Factors the 2×2 map `diag(1/tile) · R(rotation - grain) · diag(±width, height)` into scale then rotate: the angle and `scale.y` come from its second row, and `scale.x` is the determinant over `scale.y`, so a flip appears as a negative scale.
 * @evidence contracts/common.md#clear-and-simple-design Fills the offset, scale and rotation fields the PBR texture reference already has rather than opening a second texturing path.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A piece whose map needs a shear never receives an approximate transform; its producer lists it as sheared instead.
 * @evidence contracts/common.md#meaningful-documentation States the producer and coordinate source, the matrix order, the unit of the offset, the sign meaning of `scale.x`, and the rotation range.
 * @evidenceExclude contracts/performance.md#cost-and-resources Five numbers and an id derived in constant time per placement for one material's sheet and tile, with no reference back to the placement.
 * @author Samchon
 */
export interface IAutoMoviePatternTextureTransform {
  /** The occurrence this samples for. */
  id: string;

  /** Normalized UV offset, in turns of the texture sheet. */
  offset: {
    /** Offset along the texture's own U axis. */
    x: number;

    /** Offset along the texture's own V axis. */
    y: number;
  };

  /** Normalized UV scale; a negative `x` is the mirrored piece. */
  scale: {
    /** Scale along the texture's own U axis. */
    x: number;

    /** Scale along the texture's own V axis, always positive. */
    y: number;
  };

  /** UV rotation in degrees, within `[-180, 180]`. */
  rotationDeg: number;
}
