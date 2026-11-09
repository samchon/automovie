import type { IAutoMovieRecoveryMapPose } from "../image/IAutoMovieRecoveryMapPose";

/**
 * Qualified rigid result of calibrated nonplanar projective initialization.
 *
 * @evidence contracts/development/design.md#principled-representation The numerical owner returns a proper world-to-camera pose only after original-design rank, null separation and rigid-projection gates pass.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This named result separates accepted coefficients from optional unfinished diagnostic state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A raw projective camera or refused projection is not a pose in this result.
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish dimensionless qualification ratios from the unknown-scale translation.
 */
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
