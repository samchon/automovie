/**
 * One occurrence's sampling of its material, in the PBR record's own UV
 * transform.
 *
 * Produced by `autoMoviePatternTextureTransforms` for normalized unit-square
 * UVs. At zero texture centre the viewer/Three matrix is `diag(scale) ·
 * R(-rotationDeg) · uv + offset`: column vectors rotate first and then scale
 * per axis. Offset is in sheet turns, and a mirrored piece uses negative
 * scale.x under the producer's numerical premises.
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

    /**
     * Computed second-row length; positive under the producer's well-scaled
     * numerical premises.
     */
    y: number;
  };

  /** UV rotation in degrees, within `[-180, 180]`. */
  rotationDeg: number;
}
