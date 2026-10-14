import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One root's emergence request to `humanFaceHairEmergence`.
 *
 * `normal` is the current root's outward host normal and `field` is its desired styling direction in the same head axes. Regional styling can read the neutral root, but these vectors are supplied to the current emergence calculation. `degrees` is an admitted authored elevation or a legacy scalp trial above the tangent plane. The field's tangential part fixes azimuth; a missing tangent makes this generic helper return the normalized normal, while authored non-normal preparation refuses that singularity upstream.
 *
 * @evidence contracts/common.md#principled-implementation Surface normal and growth field define azimuth while an explicit tangent-plane elevation defines tilt, preserving those two angular responsibilities.
 * @evidence contracts/common.md#clear-and-simple-design One request record supplies the emergence owner with only the vectors and elevation needed for its direction calculation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit authored targets are not retried at legacy angles; a singular tangent returns the normal in the generic helper, so authored non-normal preparation rejects it before this call.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies current head-frame vectors, degree elevation, tangential azimuth and the singular-tangent distinction between this helper and authored preparation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The request type performs no vector projection; humanFaceHairEmergence owns normalization and bounded trigonometric weighting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Normal, field and degrees define one evaluation input with no in-flight or completed result registry.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed emergence vectors and one scalar require no explicit release or cancellation path.
 *
 * @author Samchon
 */
export interface IHumanFaceHairEmergenceRequest {
  /** Root surface normal. */
  normal: IAutoMovieVector3;

  /** Authored growth field at the root. */
  field: IAutoMovieVector3;

  /** Exit elevation above the tangent plane, in degrees. */
  degrees: number;
}
