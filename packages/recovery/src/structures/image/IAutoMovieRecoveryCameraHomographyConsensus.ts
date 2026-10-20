/**
 * Competing planar explanation on the fixed final epipolar-inlier population.
 *
 * @evidence contracts/common.md#principled-implementation Found forbidden overlap and completed conditional absence-search work are distinct evidence; neither proves camera truth.
 * @evidence contracts/common.md#clear-and-simple-design The named record is shared by the camera producer and evidence consumers without retaining numerical scratch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These recorded quantities supply no expected pose, metric scale, completed surface or missing measurement.
 * @evidence contracts/common.md#meaningful-documentation Members state the population, overlap threshold, actual trial work, conditional target and numerical refusals.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased record performs no computation; producing operations document their work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration defines no cache or shared effect.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Plain values belong to the caller; the declaration acquires no handle or running task.
 */
export interface IAutoMovieRecoveryCameraHomographyConsensus {
  /** Fixed final epipolar-inlier population; returned matches identify its members. */
  population: number;

  /** Best finite symmetric-transfer support count within that population. */
  support: number;

  /** Integer count at or above which the declared overlap refuses this nonplanar route. */
  forbiddenSupport: number;

  /** Actual four-point proposal count. */
  trials: number;

  /** Conditional ideal target for the forbidden support, null when unattainable. */
  requiredTrialsAtForbiddenSupport: number | null;

  /** Completed target for the conditional absence search; never a geometric proof of absence. */
  conditionalTrialTargetMet: boolean;

  /** Direct observed ambiguity evidence, independent of an unfinished absence target. */
  forbiddenOverlapFound: boolean;

  /** Numerical proposal failures. */
  numericalRefusals: number;

  /** Numerical failures while refitting an improving homography support set. */
  refitRefusals: number;
}
