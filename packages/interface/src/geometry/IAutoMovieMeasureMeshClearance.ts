/**
 * Minimum directional depth separation for each overlapping front triangle.
 *
 * Triangle is an original front-triangle ordinal; minimum is front-minus-back
 * depth in the meshes' common metre frame. The measurement validates buffers,
 * axis and arithmetic; it skips axial projections of zero area and omits
 * triangles with no overlap, so this is not a volume collision test.
 */
export namespace IAutoMovieMeasureMeshClearance {
  /**
   * Front-minus-back depth measurements along one axis over the complete
   * projected overlap of two triangle meshes.
   *
   * Each entry belongs to one front triangle, by ordinal, and gives its
   * smallest signed depth separation from any back triangle in mesh-local
   * metres: positive is clear, zero is contact, negative breaks the declared
   * front-back ordering. A front triangle with no projected overlap is not
   * reported. The projection plane is Y/Z for depth X, Z/X for depth Y and X/Y
   * for depth Z. Triangles parallel to the depth axis are skipped, so this is
   * directional surface ordering, not a closed-volume collision test. Both
   * meshes must already share a frame; callers own transforms and which pairs
   * may touch. Neither input is changed.
   *
   * The optional `visit` receives every overlap polygon vertex as a witness,
   * clear ones included, so a later coupled displacement can keep every one of
   * those inequalities and not only the violated ones. Throws on an invalid
   * axis, a malformed index buffer, a non-finite position, and projected area,
   * clipping or depth arithmetic that overflows.
   *
   * The list and entries are newly allocated and mutable. The optional
   * measurement visitor runs synchronously for every clipped overlap vertex,
   * may retain its fresh witness arrays, and is not retained after return; a
   * visitor exception propagates and prevents return of the list.
   */
  export type IResult = ITriangleClearance[];

  /** Smallest signed separation over one front triangle's projected overlap. */
  export type ITriangleClearance = {
    /**
     * Zero-based ordinal of the original front triangle, in ascending order;
     * absent ordinals have no nondegenerate projected overlap.
     */
    triangle: number;

    /**
     * Minimum front-minus-back axial depth over all projected overlaps for this
     * triangle, metres; positive is clear, zero contact, negative reversed
     * ordering.
     */
    minimum: number;
  };
}
