/**
 * Owned convex simplex iterate with a complete Frank-Wolfe gap certificate.
 *
 * @evidence contracts/common.md#principled-implementation The convex objective is half the squared aggregate norm plus the affine term; its full simplex pricing gap bounds objective suboptimality independently of active-set rank.
 * @evidence contracts/common.md#clear-and-simple-design The result separates a finite iterate and its certificate from normal termination and consumed work.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A budget-limited or stalled iterate is not converged, and a convex gap is not nonlinear stationarity or geometric accuracy.
 * @evidence contracts/common.md#meaningful-documentation Members state simplex ownership, objective normalization, raw full gap and exact termination meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no minimization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns O(width+atoms) returned scalars, without a Gram matrix, full nullspace or external resource.
 */
export interface IAutoMovieSimplexMinimum {
  /** Nonnegative weights summing to one to floating arithmetic accuracy. */
  weights: number[];

  /** Sum of weight times each sparse vector in the declared coordinates. */
  aggregate: number[];

  /** Half squared aggregate norm plus the weighted affine coefficient. */
  objective: number;

  /** Minimum a_i dot aggregate + offset_i over every atom. */
  minimumPrice: number;

  /** Computed nonnegative pricing-slack sum plus gapMassAllowance; not an interval bound on dot-product roundoff. */
  gap: number;

  /** Absolute measured (sum(weights)-1)*minimumPrice correction in objective units. */
  gapMassAllowance: number;

  /** Absolute measured sum(weights)-1 after normalization and complete pricing. */
  simplexResidual: number;

  /** Computed complete pricing gap passed the target and simplex sum passed its explicit Float64 summation allowance. */
  converged: boolean;

  /** Gap termination, explicit work/iteration exhaustion or unrepresentable progress. */
  termination: "gap" | "iteration-budget" | "work-budget" | "stalled";

  /** Actual pairwise weight transfers performed. */
  iterations: number;

  /** Conservative scalar visits charged before the corresponding operation. */
  work: number;
}
