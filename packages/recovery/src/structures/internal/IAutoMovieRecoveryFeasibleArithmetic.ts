/**
 * Forward-error bounds for an exactly normalized version of stored dual weights.
 *
 * @evidence contracts/common.md#principled-implementation Sequential product/sum gamma bounds and outward binary64 arithmetic separate aggregate formation, exact simplex normalization, row pricing and minimum-price uncertainty.
 * @evidence contracts/common.md#clear-and-simple-design These fixed scalar bounds supplement the actual returned-row residuals rather than replacing their measured values.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A numerical reconstruction allowance is not attainment of the requested sub-ulp gap or nonlinear KKT.
 * @evidence contracts/common.md#meaningful-documentation Aggregate uses infinity-norm coordinate units; minimumPrice and gap use the authored QP objective units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no scan.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A fixed scalar record transfers without row arrays or iteration history.
 */
export interface IAutoMovieRecoveryFeasibleArithmetic {
  /** Infinity-norm error to the exact aggregate of the exactly normalized stored weights. */
  aggregate: number;

  /** Absolute difference bound for the minimum authored row price. */
  minimumPrice: number;

  /** Absolute discrepancy bound between computed and exact normalized-dual gaps. */
  gap: number;
}
