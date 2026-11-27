/**
 * Population and contact classification for the mesh triangle crossing census
 * `AutoMovieEngineMeshCrossingQuery.measure`.
 *
 * A transverse point is supplied only after the strict edge/triangle predicate
 * admits it. Rejecting that point continues through the remaining edges and
 * candidate triangles; it never exempts the whole triangle pair. Coplanar
 * overlap has no transverse point and keeps its separate report.
 */
export interface IAutoMovieMeshCrossingOptions {
  /** Retain every crossing pair; omitted reports one pair per first triangle. */
  allPairs?: boolean;

  /**
   * Dimensionless interior margin in segment and triangle coordinates, in [0,
   * 0.5), that classifies near-boundary residues as contact; omitted is zero
   * and a value outside the range throws.
   */
  interiorTolerance?: number;

  /**
   * Return true to count this transverse intersection, given in the meshes'
   * shared frame with the first and second triangle ordinals of the original
   * index buffers. The callback must not mutate geometry. Omitted counts every
   * strict intersection. The connected face and lash clearance readers use it
   * to classify individual insertion witnesses without exempting a pair.
   */
  acceptTransversePoint?: (
    point: readonly number[],
    triangle: number,
    other: number,
  ) => boolean;
}
