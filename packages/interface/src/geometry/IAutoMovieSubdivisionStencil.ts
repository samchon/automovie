/**
 * Position-independent Catmull-Clark limit weights for a quad cage, stored as
 * compressed rows.
 *
 * Vertex i uses terms from offsets[i] through offsets[i + 1] - 1. Multiply each
 * term's weight by the control position at its index and sum them. A caller can
 * reuse the rows while the cage's face connectivity stays fixed.
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
