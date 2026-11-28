/**
 * One vertex and its quad-fan geometry with edge-aligned sharpness.
 *
 * All positions share a local frame and unit. Diagonal i is the corner opposite
 * the centre in the quad between fan edges i and i + 1. The interior fan wraps
 * and has equal edge and diagonal counts. A boundary fan has one more edge,
 * with permanently sharp first and last edges.
 */
export interface IAutoMovieSubdivisionRing {
  /** The vertex, as `[x, y, z]`. */
  centre: number[];

  /** Packed edge neighbours in fan order. */
  edges: number[];

  /** Packed diagonal neighbours in fan order. */
  diagonals: number[];

  /** Sharpness of each edge, 10 for boundary edges. */
  sharpness: number[];
}
