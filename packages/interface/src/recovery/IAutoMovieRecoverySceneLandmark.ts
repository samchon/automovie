import type { IAutoMovieRecoveryMapLandmark } from "..";

/**
 * Accepted scene fitting point with the retained camera pair that provides its
 * strongest resolved acute parallax.
 */
export interface IAutoMovieRecoverySceneLandmark extends IAutoMovieRecoveryMapLandmark {
  /**
   * Original source indices of the two retained observations with the strongest
   * acute parallax after fitting.
   */
  supportingViews: [number, number];

  /**
   * Acute angle of the supporting ray pair, in degrees. An accepted landmark
   * meets the point parallax threshold.
   */
  acuteParallaxDegrees: number;
}
