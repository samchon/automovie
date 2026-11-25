/** Owned convex simplex iterate with a complete Frank-Wolfe gap certificate. */
export interface IAutoMovieSimplexMinimum {
  /** Nonnegative weights summing to one to floating arithmetic accuracy. */
  weights: number[];

  /** Sum of weight times each sparse vector in the declared coordinates. */
  aggregate: number[];

  /** Half squared aggregate norm plus the weighted affine coefficient. */
  objective: number;

  /** Minimum a_i dot aggregate + offset_i over every atom. */
  minimumPrice: number;

  /**
   * Computed nonnegative pricing-slack sum plus gapMassAllowance; not an
   * interval bound on dot-product roundoff.
   */
  gap: number;

  /**
   * Absolute measured (sum(weights)-1)*minimumPrice correction in objective
   * units.
   */
  gapMassAllowance: number;

  /** Absolute measured sum(weights)-1 after normalization and complete pricing. */
  simplexResidual: number;

  /**
   * Computed complete pricing gap passed the target and simplex sum passed its
   * explicit Float64 summation allowance.
   */
  converged: boolean;

  /**
   * Gap termination, explicit work/iteration exhaustion or unrepresentable
   * progress.
   */
  termination: "gap" | "iteration-budget" | "work-budget" | "stalled";

  /** Actual pairwise weight transfers performed. */
  iterations: number;

  /** Conservative scalar visits charged before the corresponding operation. */
  work: number;
}
