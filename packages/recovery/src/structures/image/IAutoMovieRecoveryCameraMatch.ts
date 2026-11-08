/**
 * One tentative unique mutual appearance correspondence in original pixels.
 *
 * @evidence contracts/development/design.md#principled-representation Appearance distances propose correspondence; calibrated and competing planar support remain separate measured classifications.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named record is shared by the camera producer and evidence consumers without retaining numerical scratch.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts These recorded quantities supply no expected pose, metric scale, completed surface or missing measurement.
 * @evidence contracts/development/common.md#meaningful-documentation Members give feature identities, both pixel-centre coordinates, Euclidean ratio and the meaning of geometric support flags.
 */
export interface IAutoMovieRecoveryCameraMatch {
  /** Selected first-view feature index. */
  firstFeatureIndex: number;

  /** Selected second-view feature index. */
  secondFeatureIndex: number;

  /** First original pixel-centre coordinate [column,row]. */
  firstPx: [number, number];

  /** Second original pixel-centre coordinate [column,row]. */
  secondPx: [number, number];

  /** Euclidean descriptor distance divided by its distinct second-neighbour distance. */
  descriptorDistanceRatio: number;

  /** Squared Euclidean distance between normalized appearance descriptors. */
  squaredDescriptorDistance: number;

  /** Whether the fitted final consensus meets the Sampson threshold, before the separate essential-projection consistency check. */
  epipolarInlier: boolean;

  /** Whether the best competing map supports this final epipolar inlier. */
  homographyInlier: boolean;
}
