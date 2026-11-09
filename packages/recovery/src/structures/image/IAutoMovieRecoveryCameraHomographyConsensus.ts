/**
 * Competing planar explanation on the fixed final epipolar-inlier population.
 *
 * @evidence contracts/development/design.md#principled-representation Found forbidden overlap and completed conditional absence-search work are distinct evidence; neither proves camera truth.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named record is shared by the camera producer and evidence consumers without retaining numerical scratch.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts These recorded quantities supply no expected pose, metric scale, completed surface or missing measurement.
 * @evidence contracts/development/common.md#meaningful-documentation Members state the population, overlap threshold, actual trial work, conditional target and numerical refusals.
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
