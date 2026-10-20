/**
 * One tentative unique mutual appearance correspondence in original pixels.
 *
 * @evidence contracts/common.md#principled-implementation Appearance distances propose correspondence; calibrated and competing planar support remain separate measured classifications.
 * @evidence contracts/common.md#clear-and-simple-design The named record is shared by the camera producer and evidence consumers without retaining numerical scratch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These recorded quantities supply no expected pose, metric scale, completed surface or missing measurement.
 * @evidence contracts/common.md#meaningful-documentation Members give feature identities, both pixel-centre coordinates, Euclidean ratio and the meaning of geometric support flags.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased record performs no computation; producing operations document their work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration defines no cache or shared effect.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Plain values belong to the caller; the declaration acquires no handle or running task.
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
