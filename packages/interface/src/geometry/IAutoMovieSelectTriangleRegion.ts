/**
 * Connectivity and an oriented separating boundary for triangle-patch
 * selection.
 *
 * Indices and boundary entries are nonnegative integer vertex identities with
 * no coordinate frame or length unit. The selector checks triangle layout,
 * distinct corners, manifold winding and a unique boundary of at least three
 * vertices; absent edges, nonseparating loops and exterior free edges refuse.
 */
export namespace IAutoMovieSelectTriangleRegion {
  /**
   * Connectivity selecting the triangle patch on the inward side of an oriented
   * mesh boundary.
   *
   * The boundary lists each vertex once, in the order the selected faces wind:
   * the triangle that traverses boundary edge `a -> b` in that direction is
   * inside. Selection floods across shared edges from those triangles and never
   * crosses a boundary edge, so it depends on connectivity alone and a pose or
   * a folded projection cannot change which triangles a closed loop encloses.
   *
   * The input must have consistently wound manifold edges, every triangle with
   * three distinct vertices. A boundary edge missing from the mesh is refused,
   * a loop that does not separate the surface is refused, and on an open
   * surface the patch may not reach a free edge outside the supplied boundary.
   */
  export type IProps = {
    /**
     * Borrowed triangle vertex identities in triples, nonnegative integers and
     * three distinct per face; shared edges must be manifold and consistently
     * wound. No position-buffer upper bound is available here.
     */
    indices: readonly number[];

    /**
     * Borrowed separating loop of at least three distinct vertex identities,
     * without repeating the first; edge a to b selects the incident triangle
     * traversing a to b in the same direction.
     */
    boundary: readonly number[];
  };
}
