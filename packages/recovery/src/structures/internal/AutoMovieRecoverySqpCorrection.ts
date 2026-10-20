/**
 * Form one same-base physical correction from actual failed-full-trial g.
 *
 * @evidence contracts/common.md#principled-implementation The minimum metric norm solves A_E*delta=-g_E(trial)-norm(A_E)*norm(step)^2.5 in the unchanged base tangent.
 * @evidence contracts/common.md#clear-and-simple-design Constraint measurement stays with the problem, while the retained thin factor supplies its right-inverse action.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null, nonfinite values, underflowed tightening, large correction or unresolved equalities retain no supported correction and never mean convergence.
 * @evidence contracts/common.md#meaningful-documentation Borrows same-order actual g and returns an owned physical correction or null; repeated invocation is a programming error.
 * @evidence contracts/performance.md#efficient-algorithms One O(q*H+H^2) factor action plus owner inverse metric conversion is reserved before factor allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work The current independent working transpose is reused without refactorization or a new Jacobian at the trial pose.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One returned vector transfers; factors remain model-local and no failed-trial history is retained.
 */
export type AutoMovieRecoverySqpCorrection = (
  values: readonly number[],
) => number[] | null;
