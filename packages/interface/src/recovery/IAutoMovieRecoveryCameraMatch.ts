/**
 * One ordered tentative appearance match with original pixel locations and the
 * fit's geometric support flags.
 */
export interface IAutoMovieRecoveryCameraMatch {
  /** Retained feature index in the ordered first image. */
  firstFeatureIndex: number;

  /** Retained feature index in the ordered second image. */
  secondFeatureIndex: number;

  /** Observed first-image pixel center [column, row] in the original chart. */
  firstPx: [number, number];

  /** Observed second-image pixel center [column, row] in the original chart. */
  secondPx: [number, number];

  /**
   * Forward Euclidean descriptor distance divided by the second distinct
   * candidate's Euclidean distance.
   */
  descriptorDistanceRatio: number;

  /** Squared Euclidean distance between the two normalized descriptors. */
  squaredDescriptorDistance: number;

  /**
   * The tentative row belongs to the fitted epipolar consensus before its
   * independent essential-projection consistency check.
   */
  epipolarInlier: boolean;

  /**
   * The best competing homography supports this row within the final epipolar
   * population.
   */
  homographyInlier: boolean;
}
