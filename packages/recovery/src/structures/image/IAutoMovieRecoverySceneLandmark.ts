import type { IAutoMovieRecoveryMapLandmark } from "./IAutoMovieRecoveryMapLandmark";

/**
 * A qualified sparse point with an actual observed parallax-supporting pair.
 *
 * @evidence contracts/development/design.md#principled-representation The inherited point and measurements share the seed gauge; the stored pair references retained registered observations rather than assuming visibility in the seed.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One additive record preserves existing point consumers and exposes the scene-specific support needed to judge newly triangulated points.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Supporting observations are geometric evidence, not material identity, physical scale or landmark ground truth.
 * @evidence contracts/development/common.md#meaningful-documentation Members define actual source indices and acute support semantics.
 */
export interface IAutoMovieRecoverySceneLandmark extends IAutoMovieRecoveryMapLandmark {
  /** Two retained source indices supplying the strongest acute angle after final refinement. */
  supportingViews: [number, number];

  /** That actual pair's acute angle in degrees, at least the declared point threshold. */
  acuteParallaxDegrees: number;
}
