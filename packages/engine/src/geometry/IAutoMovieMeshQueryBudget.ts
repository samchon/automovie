/**
 * A caller-owned, mutable count of geometry work a bounded query may still
 * spend.
 *
 * `createAutoMovieMeshSeparationQuery` spends one unit per visited box and per
 * tested triangle, normal triple, projection axis or edge pair before doing
 * that work, and refuses by name on exhaustion or a malformed count. The same
 * object may be shared across many queries and refinement steps. The caller
 * owns the spent count and must not reset it mid-refinement, so a whole fit
 * stays under one bound.
 *
 * @author Samchon
 */
export interface IAutoMovieMeshQueryBudget {
  /** Units of work left, a nonnegative safe integer decremented in place. */
  remaining: number;
}
