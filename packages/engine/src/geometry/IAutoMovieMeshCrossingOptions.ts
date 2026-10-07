/**
 * Population and contact classification for the mesh triangle crossing census.
 *
 * A transverse point is supplied only after the existing strict edge/triangle
 * predicate admits it. Rejecting that point continues through the remaining
 * edges and candidate triangles; it never exempts the whole triangle pair.
 * Coplanar overlap has no transverse point and retains its separate report.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Allows a caller to classify intended point contacts without dropping other crossings of the same geometry.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Keeps original triangle ordinals and the strict crossing predicate while controlling witness population.
 * @author Samchon
 */
export interface IAutoMovieMeshCrossingOptions {
  /** Retain every crossing pair; omitted reports one pair per first triangle. */
  allPairs?: boolean;

  /** Dimensionless interior margin in segment and triangle coordinates, in [0, 0.5). Omitted is zero. */
  interiorTolerance?: number;

  /**
   * Return true to count this transverse intersection, in the meshes' shared
   * frame. Triangle ordinals address the original index buffers. The callback
   * must not mutate geometry. Omitted counts every strict intersection.
   *
   * The connected face and lash clearance readers use this callback to
   * classify individual insertion witnesses without exempting a triangle pair.
   */
  acceptTransversePoint?: (
    point: readonly number[],
    triangle: number,
    other: number,
  ) => boolean;
}
