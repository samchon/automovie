import type { IAutoMovieRecoveryMapPose } from "../../index";

/**
 * Optional caller-owned evidence from one attempted DLT initialization. A fresh
 * record starts at admission; absent fields mean their stage was not reached.
 * These unfinished coefficients never qualify a camera for use.
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

  /**
   * Row-major 3-by-4 calibrated projective matrix after undoing both
   * normalizations; homogeneous sign and scale remain arbitrary.
   */
  projective?: number[];

  /** Sign aligning the projective rotation-block determinant to positive. */
  projectiveSign?: number;

  /** Relative Frobenius discrepancy from the scaled proper rotation. */
  projectionError?: number;

  /**
   * Finite rigid projection before the discrepancy gate; diagnostic even when
   * the attempt refuses. Translation retains the map gauge.
   */
  projectedPose?: IAutoMovieRecoveryMapPose;
}
