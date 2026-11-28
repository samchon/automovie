/**
 * Refined indexed face-varying UV values with pinned chart boundaries.
 *
 * UVs keep the source chart's range and units. Each child corner indexes the
 * refined values. Continuity compares endpoint UV identities across an edge.
 * Equal numeric values may still define a seam.
 */
export namespace IAutoMovieRefineSubdivisionUvs {
  /**
   * Face-varying UVs after one Catmull-Clark step with every UV boundary
   * pinned, OpenSubdiv's `FVAR_LINEAR_BOUNDARIES`.
   *
   * An edge is UV-continuous when it has two faces that name the same UV
   * indices at both ends; a mesh boundary edge or a seam is a UV boundary. A UV
   * value at a vertex touching any UV boundary keeps its value, a UV boundary
   * edge gives each side the midpoint of that side's two values, and everything
   * else follows the same rules and masks as the positions, so creases sharpen
   * UVs alike. Each chart's boundary therefore stays the piecewise-linear
   * polygon of its cage UVs at every level while its interior smooths with the
   * surface.
   *
   * Child values are numbered as positions are: one per parent UV value, then
   * one per continuous edge or one per side of a UV boundary edge in edge
   * order, then one per face. Child corner `4 c + j` belongs to the child quad
   * of parent corner `c`, in the order vertex, out-edge, face, in-edge.
   *
   * Both arrays are newly allocated and mutable. Supply admitted per-corner
   * indices and UV ownership together with the matching geometry masks.
   */
  export type IResult = {
    /**
     * New packed [u,v] values in source chart units: parent values first, edge
     * values (one per continuous edge or boundary side), then face values.
     */
    uvs: number[];

    /**
     * New zero-based UV indices, four per parent corner c: child corner 4c+j
     * names vertex, outgoing edge, face, then incoming edge values.
     */
    cornerUvs: number[];
  };
}
