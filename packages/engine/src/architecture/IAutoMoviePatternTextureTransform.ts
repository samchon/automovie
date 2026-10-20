/**
 * One occurrence's sampling of its material, in the PBR record's own UV
 * transform.
 *
 * Produced by `autoMoviePatternTextureTransforms` for normalized unit-square UVs. At zero texture centre the viewer/Three matrix is `diag(scale) · R(-rotationDeg) · uv + offset`: column vectors rotate first and then scale per axis. Offset is in sheet turns, and a mirrored piece uses negative scale.x under the producer's numerical premises.
 *
 * @evidence contracts/common.md#principled-implementation Factors approximately orthogonal map rows into `diag(scale) · R(-rotationDeg)`: second-row angle/length determine the turn and vertical scale, while determinant over vertical length supplies signed horizontal scale. This matches the viewer's zero-centre Three texture matrix, rather than scale-then-rotate column-vector composition.
 * @evidence contracts/common.md#clear-and-simple-design Uses the offset, scale and rotation fields the PBR texture reference already has, so no second texturing path is introduced.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The producer reports row skew above its `1e-9` relative tolerance instead of emitting it; below-threshold residual skew is admitted, so this record is not an exact zero-shear certificate.
 * @evidence contracts/common.md#meaningful-documentation States producer, normalized UV source, the zero-centre matrix/order, offset units, mirrored scale sign, rotation range and tolerated residual skew.
 * @evidenceExclude contracts/performance.md#efficient-algorithms No code; each transform is constant-time, answered on `autoMoviePatternTextureTransforms`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Computed per call against one material sheet and tile size, both inputs, so no transform is kept for another call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Fresh numbers and an id string, owned by the texturing result's `transforms` array.
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

    /** Computed second-row length; positive under the producer's well-scaled numerical premises. */
    y: number;
  };

  /** UV rotation in degrees, within `[-180, 180]`. */
  rotationDeg: number;
}
