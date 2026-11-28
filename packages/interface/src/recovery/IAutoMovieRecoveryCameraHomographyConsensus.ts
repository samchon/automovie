/**
 * Evidence from a competing planar fit on the selected epipolar inliers. A
 * large enough observed overlap can refuse the nonplanar route.
 */
export interface IAutoMovieRecoveryCameraHomographyConsensus {
  /** Number of fixed epipolar inliers offered to the planar competitor. */
  population: number;

  /**
   * Number of those pairs within the symmetric transfer bound for the best
   * homography.
   */
  support: number;

  /** Smallest integer overlap count that refuses the nonplanar route. */
  forbiddenSupport: number;

  /** Four-point proposals evaluated, including numerical refusals. */
  trials: number;

  /**
   * Ideal sampling target for finding the forbidden support, or null when a
   * finite target is unavailable.
   */
  requiredTrialsAtForbiddenSupport: number | null;

  /**
   * Whether the proposal count met the configured minimum and the conditional
   * target at the forbidden support.
   */
  conditionalTrialTargetMet: boolean;

  /** Whether an evaluated homography reaches or exceeds the forbidden support. */
  forbiddenOverlapFound: boolean;

  /** Raw four-point proposals refused by numerical fitting or scoring. */
  numericalRefusals: number;

  /** Recognized numerical failures while refitting an improving support set. */
  refitRefusals: number;
}
