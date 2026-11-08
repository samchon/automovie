/**
 * Forward-error bounds for an exactly normalized version of stored dual weights.
 *
 * @evidence contracts/development/design.md#principled-representation Sequential product/sum gamma bounds and outward binary64 arithmetic separate aggregate formation, exact simplex normalization, row pricing and minimum-price uncertainty.
 * @evidence contracts/development/design.md#minimal-and-owned-surface These fixed scalar bounds supplement the actual returned-row residuals rather than replacing their measured values.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A numerical reconstruction allowance is not attainment of the requested sub-ulp gap or nonlinear KKT.
 * @evidence contracts/development/common.md#meaningful-documentation Aggregate uses infinity-norm coordinate units; minimumPrice and gap use the authored QP objective units.
 */
export interface IAutoMovieRecoveryFeasibleArithmetic {
  /** Infinity-norm error to the exact aggregate of the exactly normalized stored weights. */
  aggregate: number;

  /** Absolute difference bound for the minimum authored row price. */
  minimumPrice: number;

  /** Absolute discrepancy bound between computed and exact normalized-dual gaps. */
  gap: number;
}
