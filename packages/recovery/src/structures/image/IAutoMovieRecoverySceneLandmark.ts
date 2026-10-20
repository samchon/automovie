import type { IAutoMovieRecoveryMapLandmark } from "./IAutoMovieRecoveryMapLandmark";

/**
 * A qualified sparse point with an actual observed parallax-supporting pair.
 *
 * @evidence contracts/common.md#principled-implementation The inherited point and measurements share the seed gauge; the stored pair references retained registered observations rather than assuming visibility in the seed.
 * @evidence contracts/common.md#clear-and-simple-design One additive record preserves existing point consumers and exposes the scene-specific support needed to judge newly triangulated points.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supporting observations are geometric evidence, not material identity, physical scale or landmark ground truth.
 * @evidence contracts/common.md#meaningful-documentation Members define actual source indices and acute support semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This record defines no cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller-owned arrays acquire no resource.
 */
export interface IAutoMovieRecoverySceneLandmark extends IAutoMovieRecoveryMapLandmark {
  /** Two retained source indices supplying the strongest acute angle after final refinement. */
  supportingViews: [number, number];

  /** That actual pair's acute angle in degrees, at least the declared point threshold. */
  acuteParallaxDegrees: number;
}
