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
