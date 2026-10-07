/**
 * Proved contact cap of an attached fan on one original support triangle.
 *
 * Every possible contact of the complete fan with that support lies within
 * `cap` metres of the registered root. The cap reports a possible
 * root-registration contact region; it does not label any other part of the
 * fan as an accepted crossing.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Reports the bounded contact region an attached composable feature proved on each support face.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Pairs each cap with the original support triangle ordinal it was proved against.
 * @author Samchon
 */
export interface IAutoMovieMeshAttachmentCap {
  /**
   * Original resident support triangle ordinal.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Identifies the support face whose contact the cap bounds.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Uses the original source triangle ordinal rather than a hierarchy position.
   */
  triangle: number;

  /**
   * Outward-rounded upper bound, in metres, on any contact point's distance
   * from the registered root.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Bounds the whole fan's possible contact with the support instead of one nearest witness.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Encloses the root cap computed from outward projection intervals on the original support.
   */
  cap: number;
}
