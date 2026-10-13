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
 * @evidence contracts/common.md#principled-implementation Expresses the map from a piece's unit UV onto the grain-turned sheet as scale then rotation, reading the angle and vertical scale from the second row and the signed horizontal scale from the determinant, so a mirror becomes a negative `scale.x`.
 * @evidence contracts/common.md#clear-and-simple-design Uses the offset, scale and rotation fields the PBR texture reference already has, so no second texturing path is introduced.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A transform that would need shear is not emitted; the occurrence is listed as sheared instead of receiving a skewed approximation.
 * @evidence contracts/common.md#meaningful-documentation States the producer and coordinate source, the scale-then-rotate order, the turn units of `offset`, the sign convention for a mirrored piece, and the rotation range.
 * @evidenceExclude contracts/performance.md#efficient-algorithms No code; each transform is constant-time, answered on `autoMoviePatternTextureTransforms`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Computed per call against one material sheet and tile size, both inputs, so no transform is kept for another call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Fresh numbers and an id string, owned by the texturing result's `transforms` array.
 * @author Samchon
 */
export interface IAutoMoviePatternTextureTransform {
  /** Occurrence id, `"<zone>/<module>"`, this transform samples for. */
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
