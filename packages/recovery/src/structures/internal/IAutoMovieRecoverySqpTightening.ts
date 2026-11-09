/**
 * Current-model scalar choice for one strict inward correction target.
 *
 * @evidence contracts/development/design.md#principled-representation With W=sum(lambda_i*norm(A_i)) from the same certified untilted dual and actual mixed physical direction p, W>0 caps norm(p)^2.5 by sqrt(norm(p_S))*(-f*p)/W; structural W=0 retains the original ceiling. In exact arithmetic the weighted margin is o(-f*p) as norm(p_S) tends to zero; the 2.5 order additionally requires comparable step norms, a quadratic descent lower bound and bounded multiplier price.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Fixed scalar metadata separates target preparation from the retained factor action and the later actual nonlinear qualification.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nonrepresentable arithmetic has no target; computed values are not interval certificates, multiplier replacements or normal convergence.
 * @evidence contracts/development/common.md#meaningful-documentation Null denotes unavailable arithmetic. A prepared scalar does not certify that a particular trial right-hand side or correction can represent its strict margin.
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
