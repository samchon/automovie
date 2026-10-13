/**
 * Named extent of the shared scalp growth mask. Polar degrees are measured from the domain's superior axis; larger angles admit roots farther from the crown. This is an authored region mask, not a measured hair-loss grade or reconstructed follicle boundary.
 *
 * @evidence contracts/common.md#principled-implementation The trait expander converts independent polar degree limits into the existing radian hairline mask, whose squared-azimuth blend can only reduce the basis-owned growth domain.
 * @evidence contracts/common.md#clear-and-simple-design Four directional limits express the mask without exposing sampled roots or a private hairline polygon.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The numerical owner checks the closed zero-to-pi bounds after conversion; increasing a mask angle cannot invent triangles outside the shared domain or establish a measured hair-loss grade.
 * @evidence contracts/common.md#meaningful-documentation Superior-axis polar angles and independent anatomical sides make these authored angular limits distinct from projected distances.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record implements no angle conversion or root acceptance calculation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It supplies mask coefficients without caching root candidates.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Four caller scalars create no growth-domain or sampled-root buffers.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHairlineAngles {
  /** Anterior polar limit in [0,180] degrees. */
  frontDegrees: number;

  /** Independent anatomical-left polar limit in [0,180] degrees. */
  leftDegrees: number;

  /** Independent anatomical-right polar limit in [0,180] degrees. */
  rightDegrees: number;

  /** Posterior polar limit in [0,180] degrees. */
  backDegrees: number;
}
