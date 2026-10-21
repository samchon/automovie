/**
 * Current-model scalar choice for one strict inward correction target.
 *
 * @evidence contracts/common.md#principled-implementation With W=sum(lambda_i*norm(A_i)) from the same certified untilted dual and actual mixed physical direction p, W>0 caps norm(p)^2.5 by sqrt(norm(p_S))*(-f*p)/W; structural W=0 retains the original ceiling. In exact arithmetic the weighted margin is o(-f*p) as norm(p_S) tends to zero; the 2.5 order additionally requires comparable step norms, a quadratic descent lower bound and bounded multiplier price.
 * @evidence contracts/common.md#clear-and-simple-design Fixed scalar metadata separates target preparation from the retained factor action and the later actual nonlinear qualification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonrepresentable arithmetic has no target; computed values are not interval certificates, multiplier replacements or normal convergence.
 * @evidence contracts/common.md#meaningful-documentation Null denotes unavailable arithmetic. A prepared scalar does not certify that a particular trial right-hand side or correction can represent its strict margin.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no scan.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It defines no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One fixed scalar record may outlive the current factor in the latest auxiliary report; it contains no input arrays, trial states or closures.
 */
export interface IAutoMovieRecoverySqpTightening {
  /** Original physical mixed-step norm raised to 2.5; null for overflow. */
  ceiling: number | null;

  /** Prepared positive inward length, or null when scalar support is absent. */
  value: number | null;

  /** Computed -f*p for the actual mixed physical direction; null if nonfinite. */
  descent: number | null;

  /** Same-QP sum of original multipliers times physical row norms; null if unresolved. */
  multiplierPrice: number | null;

  /** Scalar support branch, independent of factor, actual feasibility and normal status. */
  reason:
    | "original-ceiling"
    | "zero-multiplier-price"
    | "objective-cap"
    | "tightening-unresolved"
    | "descent-unresolved"
    | "multiplier-price-unresolved"
    | "cap-unresolved";
}
