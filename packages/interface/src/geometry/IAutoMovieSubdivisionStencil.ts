/**
 * The Catmull-Clark limit stencil of every vertex of a quad cage, from
 * `stencilSubdivisionLimit`, in compressed rows.
 *
 * Vertex `i`'s limit point is the sum over `k` from `offsets[i]` to `offsets[i
 * + 1]` of `weights[k]` times the control position of vertex `indices[k]`. The
 * stencils depend only on the cage's faces, so a cage whose positions change
 * every frame keeps them.
 */
export interface IAutoMovieSubdivisionStencil {
  /** Number of vertices. */
  count: number;

  /** Row starts, `count + 1` entries. */
  offsets: Int32Array;

  /** Vertex index of each term. */
  indices: Int32Array;

  /** Weight of each term. */
  weights: Float64Array;
}
