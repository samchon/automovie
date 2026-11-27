import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryMapDesignFit,
} from "..";

/**
 * Column-scaled least squares on the original design, with right equal to minus
 * residual. minimumRatio is the positive undamped smallest/largest
 * singular-value threshold; finite nonnegative damping supplies an augmented
 * metric without rescuing original rank. budget bounds allocation and
 * factorization work. Returned increments restore the caller's parameter units;
 * invalid rank, arithmetic or work admission throws.
 */
export namespace IAutoMovieRecoveryMapDesignSolutionOperation {
  /**
   * Column-scaled least squares on the original design, with right equal to
   * minus residual. minimumRatio is the positive undamped smallest/largest
   * singular-value threshold; finite nonnegative damping supplies an augmented
   * metric without rescuing original rank. budget bounds allocation and
   * factorization work. Returned increments restore the caller's parameter
   * units; invalid rank, arithmetic or work admission throws.
   */
  export type Operation = (
    design: readonly (readonly number[])[],
    right: readonly number[],
    minimumRatio: number,
    damping: number,
    budget: IAutoMovieRecoveryCameraMapBudget,
  ) => IAutoMovieRecoveryMapDesignFit;
}
