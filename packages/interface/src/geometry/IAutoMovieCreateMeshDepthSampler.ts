/**
 * A reusable directional surface-envelope query over a copied mesh.
 *
 * Input plane coordinates and returned axial depths are mesh-local metres, with
 * Y/Z, Z/X or X/Y query planes for X, Y or Z depth. The factory rejects
 * malformed meshes and axes; queries reject nonfinite coordinates or depths,
 * return null on a miss and skip zero-area triangle projections.
 */
export namespace IAutoMovieCreateMeshDepthSampler {
  /**
   * A synchronous axis-aligned depth sampler over a copied resident mesh.
   *
   * The returned sampler takes a point `(u, v)` in the plane perpendicular to
   * `axis` and answers the smallest and largest depth along `axis` at which a
   * triangle covers it, or `null` when none does. The query plane is Y/Z for
   * depth X, Z/X for depth Y and X/Y for depth Z, in the mesh-local metre
   * frame. An open surface may return equal depths, winding does not matter,
   * and a point on a shared edge belongs to both neighbours. A triangle whose
   * projection has zero area, one parallel to the query axis, is skipped, so
   * the sampler reports a surface envelope and not a closed-volume test.
   *
   * The mesh is copied into the index at creation, so later caller mutations
   * never change an answer. Creation throws on an invalid axis, a malformed
   * index buffer, a non-finite position, or projected area or extent arithmetic
   * that overflows; a query throws on a non-finite coordinate or depth.
   *
   * The closure retains only its copied index until released; queries are
   * synchronous, return a fresh mutable pair or null, and retain no query
   * arguments. u and v must be finite metre coordinates in the stated cyclic
   * plane order.
   */
  export type IResult = (u: number, v: number) => IDepthRange | null;

  /** Min and max surface depth at one covered plane coordinate. */
  export type IDepthRange = {
    /**
     * Smallest axial surface depth in mesh-local metres among covering
     * projected triangles; may equal maximum on an open sheet.
     */
    minimum: number;

    /**
     * Largest axial surface depth in mesh-local metres; the span between depths
     * is an envelope, not proof of occupied volume.
     */
    maximum: number;
  };
}
