/**
 * Answer of a refutation-only mesh separation query: whether one complete
 * feature is separated from the resident surface by at least the requested
 * clearance.
 *
 * `certified` has exactly the meaning of {@link IAutoMovieMeshSeparationResult}'s
 * field for the same compiled snapshot, feature and options. The query stops at
 * the first resident triangle whose conservative bound falls below the target,
 * so it reports no global lower bound, closest triangle or attachment caps.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Answers a composable feature's clearance decision without computing quantities the decision does not need.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Qualifies complete-feature clearance against original resident triangles and names the first refuting triangle.
 * @author Samchon
 */
export interface IAutoMovieMeshSeparationVerdict {
  /**
   * Whether the complete feature proved at least the requested separation;
   * false means unproved, including touches, crossings and rounding at an
   * exact limit.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Exposes the clearance decision a composable feature fit consumes.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Types the complete-feature certification decided against the resident triangles.
   */
  certified: boolean;

  /**
   * Original ordinal of the first resident triangle (or attachment support)
   * that refuted the feature, or -1 when the feature is certified.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Identifies which resident triangle blocked a composable feature.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Reports the refuting triangle by its original identity, before any spatial indexing.
   */
  witness: number;
}
