/**
 * One closed ring's span inside a triangulation's shared point list.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Preserves each planar boundary as a distinct closed ring.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Records a ring's topology inside the canonical point buffer.
 */
export interface IAutoMovieRegionRing {
  /**
   * First index the ring owns in {@link IAutoMovieRegionTriangulation.points}.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Keeps the ring boundary addressable in the shared geometry.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Identifies where this ring begins in canonical storage.
   */
  start: number;
  /**
   * How many points the ring owns.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Bounds the points belonging to one closed boundary.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Identifies the complete canonical span of this ring.
   */
  count: number;
}
