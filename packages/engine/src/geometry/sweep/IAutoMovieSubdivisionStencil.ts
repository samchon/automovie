/**
 * The Catmull-Clark limit stencil of every vertex of a quad cage, from
 * `stencilAutoMovieSubdivisionLimit`, in compressed rows.
 *
 * Vertex `i`'s limit point is the sum over `k` from `offsets[i]` to
 * `offsets[i + 1]` of `weights[k]` times the control position of vertex
 * `indices[k]`. The stencils depend only on the cage's faces, so a cage whose
 * positions change every frame keeps them.
 *
 * @evidence contracts/common.md#principled-implementation Compressed sparse rows, the standard layout of a sparse linear map applied repeatedly.
 * @evidence contracts/common.md#clear-and-simple-design Three flat arrays and the vertex count.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Built once from validated faces; nothing in it depends on positions.
 * @evidence contracts/common.md#meaningful-documentation States how a row is read and why it is kept.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; costs are on its producer and `solveAutoMovieSubdivisionLimit`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record; it is the reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record owned by its caller.
 * @author Samchon
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
