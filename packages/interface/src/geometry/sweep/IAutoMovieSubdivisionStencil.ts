/**
 * The Catmull-Clark limit stencil of every vertex of a quad cage, from
 * `stencilAutoMovieSubdivisionLimit`, in compressed rows.
 *
 * Vertex `i`'s limit point is the sum over `k` from `offsets[i]` to
 * `offsets[i + 1]` of `weights[k]` times the control position of vertex
 * `indices[k]`. The stencils depend only on the cage's faces, so a cage whose
 * positions change every frame keeps them.
 *
 * @evidence contracts/development/design.md#principled-representation Compressed sparse rows, the standard layout of a sparse linear map applied repeatedly.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three flat arrays and the vertex count.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Built once from validated faces; nothing in it depends on positions.
 * @evidence contracts/development/common.md#meaningful-documentation States how a row is read and why it is kept.
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
