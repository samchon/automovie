/** One tentative unique mutual appearance correspondence in original pixels. */
export interface IAutoMovieRecoveryCameraMatch {
  /** Selected first-view feature index. */
  firstFeatureIndex: number;

  /** Selected second-view feature index. */
  secondFeatureIndex: number;

  /** First original pixel-centre coordinate [column,row]. */
  firstPx: [number, number];

  /** Second original pixel-centre coordinate [column,row]. */
  secondPx: [number, number];

  /**
   * Euclidean descriptor distance divided by its distinct second-neighbour
   * distance.
   */
  descriptorDistanceRatio: number;

  /** Squared Euclidean distance between normalized appearance descriptors. */
  squaredDescriptorDistance: number;

  /**
   * Whether the fitted final consensus meets the Sampson threshold, before the
   * separate essential-projection consistency check.
   */
  epipolarInlier: boolean;

  /** Whether the best competing map supports this final epipolar inlier. */
  homographyInlier: boolean;
}
