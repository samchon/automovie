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
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Bounds composable resident-geometry queries by one shared, caller-owned work count instead of an unbounded search.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Names the work budget that separation qualification spends before each box, triangle and feature test.
 * @author Samchon
 */
export interface IAutoMovieMeshQueryBudget {
  /**
   * Units of work left, a nonnegative safe integer decremented in place.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Exposes `remaining` as the shared work count composable geometry queries spend.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Types `remaining` as the count separation qualification decrements before each test.
   */
  remaining: number;
}
