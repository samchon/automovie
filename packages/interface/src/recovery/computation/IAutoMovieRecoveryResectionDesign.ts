import type { IAutoMovieRecoveryMapPose } from "../../index";

/** Qualified rigid result of calibrated nonplanar projective initialization. */
export interface IAutoMovieRecoveryResectionDesign {
  /** Proper row-major world-to-camera pose in the existing map gauge. */
  pose: IAutoMovieRecoveryMapPose;

  /** Eleventh to largest singular value of the original projective design. */
  designRatio: number;

  /** Twelfth to eleventh singular value of the same original design. */
  nullRatio: number;

  /** Relative Frobenius discrepancy from the scaled proper rotation. */
  projectionError: number;
}
