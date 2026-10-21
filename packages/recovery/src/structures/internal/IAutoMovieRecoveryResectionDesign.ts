import type { IAutoMovieRecoveryMapPose } from "../image/IAutoMovieRecoveryMapPose";

/**
 * Qualified rigid result of calibrated nonplanar projective initialization.
 *
 * @evidence contracts/common.md#principled-implementation The numerical owner returns a proper world-to-camera pose only after original-design rank, null separation and rigid-projection gates pass.
 * @evidence contracts/common.md#clear-and-simple-design This named result separates accepted coefficients from optional unfinished diagnostic state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A raw projective camera or refused projection is not a pose in this result.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish dimensionless qualification ratios from the unknown-scale translation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased result performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The initializer owns factor reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Fixed-size owned coefficients transfer to the caller without an external resource.
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
