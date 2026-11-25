import type { IAutoMovieRecoveryMapLandmark } from "../../index";

/** A qualified sparse point with an actual observed parallax-supporting pair. */
export interface IAutoMovieRecoverySceneLandmark extends IAutoMovieRecoveryMapLandmark {
  /**
   * Two retained source indices supplying the strongest acute angle after final
   * refinement.
   */
  supportingViews: [number, number];

  /**
   * That actual pair's acute angle in degrees, at least the declared point
   * threshold.
   */
  acuteParallaxDegrees: number;
}
