/**
 * A caller-owned, mutable count of geometry work a bounded query may still
 * spend.
 *
 * `createAutoMovieMeshSeparationQuery` spends one unit per visited box and per
 * tested triangle, normal triple, projection axis or edge pair before doing
 * that work, and throws by name when the count is exhausted or is not a
 * nonnegative safe integer. The same object may be shared across many queries
 * and refinement steps. The caller owns the spent count and must not reset it
 * mid-refinement, so a whole fit stays under one bound.
 *
 * @evidence contracts/common.md#principled-implementation A decrement-before-work counter: the query checks `remaining` is a nonnegative safe integer on entry and throws before any unit whose spend would go below zero, so the work a caller can be charged never exceeds the count it handed over.
 * @evidence contracts/common.md#clear-and-simple-design One mutable field on a shared object, so a hair fit can thread one bound through every separation call of a curve without the query returning or merging partial counts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exhaustion throws instead of returning an uncertified or partial answer, so running out of budget never reads as a geometric refusal or a pass.
 * @evidence contracts/common.md#meaningful-documentation States the spender, what one unit buys, the admission and exhaustion refusals, that it is shared and mutated in place, and that resetting it mid-refinement defeats the bound.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A counter record; what each unit charges is answered on the separation query that spends it.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The counter is the shared state itself and is never cached or copied; reuse of verdicts belongs to callers such as the ribbon fit.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This record is the work bound: one number the caller allocates and releases, which caps the geometry units every query sharing it may still spend.
 * @author Samchon
 */
export interface IAutoMovieMeshQueryBudget {
  /**
   * Units of work left, a nonnegative safe integer decremented in place before
   * each unit is performed.
   */
  remaining: number;
}
