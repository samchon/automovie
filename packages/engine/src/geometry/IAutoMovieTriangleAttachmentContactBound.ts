/**
 * Bound on every possible contact of an anchored fan with one support face.
 *
 * When `proved` is true, any contact lies within `cap` metres of the fan's
 * registered root. `cornerGap` and `rootDeficit` are the outward-rounded slab
 * quantities s and delta behind that cap, measured along the support's stored
 * face direction in the fan's metre frame. A collapsed support reports all
 * zeros and a nonpositive corner gap leaves the proof false.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Reports complete attachment-face contact bounds instead of exempting a whole fan because its root is one zero-distance witness.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Names the outward-enclosed root cap and the slab quantities it is derived from on one original support triangle.
 * @author Samchon
 */
export interface IAutoMovieTriangleAttachmentContactBound {
  /**
   * Whether the cap bounds every contact of the complete fan with the support.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations States whether the attached fan's support contact is bounded.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Leaves a collapsed support or nonpositive corner gap unproved.
   */
  proved: boolean;

  /**
   * Upper bound, in metres, on a contact point's distance from the root; zero
   * when unproved.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Bounds the possible contact region of the whole fan.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Multiplies the bounded non-root weight by the maximum corner L1 distance with outward rounding.
   */
  cap: number;

  /**
   * Outward-rounded smallest corner height above the support slab, s.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Exposes how far the fan's free corners clear the support face.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Measures the corner gap from enclosed projection intervals, not a true face normal.
   */
  cornerGap: number;

  /**
   * Nonnegative depth of the root below the support slab's top, delta.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Exposes how deep the registered root sits within the support's enclosed slab.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Measures the root deficit against the outward-enclosed host projection maximum.
   */
  rootDeficit: number;
}
