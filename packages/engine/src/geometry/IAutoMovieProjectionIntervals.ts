/**
 * Outward-enclosed projections of represented points along a stored direction.
 *
 * Interval i encloses point i's projection relative to the origin, scaled by
 * the direction normalized only by its largest component, in metres of the
 * points' frame. `normUpper` is an upper enclosure of that scaled direction's
 * Euclidean norm. A zero direction yields zero intervals and zero norm.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Shares qualified support projections between complete-feature clearance and attachment-contact geometry without a point-sample substitute.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Encloses the supplied representation and approximate direction while preserving caller coordinates.
 * @author Samchon
 */
export interface IAutoMovieProjectionIntervals {
  /**
   * One owned [low, high] projection enclosure per input point, in input order.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Encloses every supplied point's projection for support separation and contact caps.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Rounds each endpoint outward so the whole represented feature stays enclosed.
   */
  intervals: [number, number][];

  /**
   * Upper enclosure of the scaled direction's Euclidean norm.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Lets consumers convert enclosed projections into conservative distances.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Checks the norm proposal through a lower square enclosure.
   */
  normUpper: number;
}
