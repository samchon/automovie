import type { IAutoMovieRecoveryMapPose } from "../image/IAutoMovieRecoveryMapPose";

/**
 * Optional caller-owned evidence from one attempted DLT initialization.
 * A fresh record starts at admission; absent fields mean their stage was not
 * reached. These unfinished coefficients never qualify a camera for use.
 *
 * @evidence contracts/common.md#principled-implementation Stage changes precede each existing numerical operation so a thrown refusal retains its first failing stage and only quantities actually computed.
 * @evidence contracts/common.md#clear-and-simple-design One optional mutable output records evidence without a second estimator, alternate gate or callback inside speculative numerical catches.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither partial projective coefficients nor the pre-gate rigid projection can replace a qualified pose or a missing observation.
 * @evidence contracts/common.md#meaningful-documentation States fresh caller ownership, missing-stage meaning, projective sign ambiguity and diagnostic-only coefficients.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no decomposition.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Quantities come from the same initializer execution, not a recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns one fixed-size attempt record; retaining many records is the diagnostic consumer's responsibility.
 */
export interface IAutoMovieRecoveryResectionDesignTrace {
  /** Operation about to run, or complete after every existing gate passes. */
  stage:
    | "admission"
    | "normalization"
    | "span-factorization"
    | "span"
    | "design-factorization"
    | "design-rank"
    | "rotation-block"
    | "rotation-factorization"
    | "rotation-rank"
    | "projection"
    | "pose"
    | "complete";

  /** Smallest to largest singular value of centered normalized world points. */
  spanRatio?: number;

  /** Eleventh to largest singular value of the original projective design. */
  designRatio?: number;

  /** Twelfth to eleventh singular value of the original projective design. */
  nullRatio?: number;

  /** Row-major 3-by-4 calibrated projective matrix after undoing both normalizations; homogeneous sign and scale remain arbitrary. */
  projective?: number[];

  /** Sign aligning the projective rotation-block determinant to positive. */
  projectiveSign?: number;

  /** Relative Frobenius discrepancy from the scaled proper rotation. */
  projectionError?: number;

  /** Finite rigid projection before the discrepancy gate; diagnostic even when the attempt refuses. Translation retains the map gauge. */
  projectedPose?: IAutoMovieRecoveryMapPose;
}
