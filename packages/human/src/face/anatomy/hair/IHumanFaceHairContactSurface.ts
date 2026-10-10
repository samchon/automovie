/**
 * Fresh current hair-contact collider arrays.
 * The closure producer appends centroid vertices and directed fan triangles without mutating the source arrays.
 * The hair builder consumes this query-only surface; it is not displayed skin.
 *
 * @author Samchon
 */
export interface IHumanFaceHairContactSurface {
  /** Current head-frame metre positions including closure centroids. */
  positions: number[];

  /** Original incidence followed by directed closure triangles. */
  indices: number[];
}
