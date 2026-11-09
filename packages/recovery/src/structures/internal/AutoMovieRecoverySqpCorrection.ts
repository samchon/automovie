/**
 * Form one same-base physical correction from actual failed-full-trial g.
 *
 * @evidence contracts/development/design.md#principled-representation The minimum metric norm solves A_E*delta=-g_E(trial)-norm(A_E)*tau in the unchanged base tangent. With W=sum(lambda_i*norm(A_i)) from the same untilted dual, W>0 uses min(norm(mixed)^2.5,sqrt(norm(unmixed))*(-f*mixed)/W); structural W=0 retains norm(mixed)^2.5. Conditional order2.5 and small weighted margin do not certify actual full feasibility, objective decrease or normal convergence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Constraint measurement stays with the problem, while the retained thin factor supplies its right-inverse action.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Null, nonfinite values, underflowed or RHS-absorbed strict margins, large correction or unresolved equalities retain no supported correction without deleting the valid mixed direction. A positive correction RHS is allowed; the final linear target is negative.
 * @evidence contracts/development/common.md#meaningful-documentation Borrows same-order actual g and returns an owned physical correction or null; repeated invocation is a programming error.
 */
export type AutoMovieRecoverySqpCorrection = (
  values: readonly number[],
) => number[] | null;
