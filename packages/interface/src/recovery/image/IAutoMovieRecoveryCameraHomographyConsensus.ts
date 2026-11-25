/** Competing planar explanation on the fixed final epipolar-inlier population. */
export interface IAutoMovieRecoveryCameraHomographyConsensus {
  /**
   * Fixed final epipolar-inlier population; returned matches identify its
   * members.
   */
  population: number;

  /** Best finite symmetric-transfer support count within that population. */
  support: number;

  /**
   * Integer count at or above which the declared overlap refuses this nonplanar
   * route.
   */
  forbiddenSupport: number;

  /** Actual four-point proposal count. */
  trials: number;

  /** Conditional ideal target for the forbidden support, null when unattainable. */
  requiredTrialsAtForbiddenSupport: number | null;

  /**
   * Completed target for the conditional absence search; never a geometric
   * proof of absence.
   */
  conditionalTrialTargetMet: boolean;

  /**
   * Direct observed ambiguity evidence, independent of an unfinished absence
   * target.
   */
  forbiddenOverlapFound: boolean;

  /** Numerical proposal failures. */
  numericalRefusals: number;

  /** Numerical failures while refitting an improving homography support set. */
  refitRefusals: number;
}
