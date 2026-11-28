/**
 * One signed depth condition at a clipped projected-overlap vertex, delivered
 * to the optional measureMeshClearance visitor.
 *
 * The three barycentric weights match the original front triangle's vertex
 * order. Keep any small negative roundoff. Moving those vertices along the
 * measured axis changes the gap by the weighted sum of their travels. The
 * solver keeps already-clear witnesses in the constraint population. Each
 * callback owns independent vertex and weight arrays.
 */
export interface IAutoMovieMeshClearanceWitness {
  /** Front triangle ordinal, before any spatial indexing. */
  triangle: number;

  /** Back triangle ordinal, before any spatial indexing. */
  backTriangle: number;

  /**
   * The front triangle's three original vertex ordinals, a copy the visitor
   * owns.
   */
  vertices: number[];

  /**
   * Front-triangle barycentric coefficients in the same order as `vertices`,
   * possibly slightly negative from roundoff.
   */
  weights: number[];

  /**
   * Front-minus-back depth at the overlap vertex in mesh-local metres; positive
   * is clear, zero is contact, negative violates the ordering.
   */
  gap: number;
}
