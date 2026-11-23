/**
 * The quad one-ring of one vertex: the vertex, its edge neighbours, its
 * diagonal neighbours and the sharpness of its edges.
 *
 * Edge `i` and diagonal `i` follow the fan order of `ISubdivisionTopology`:
 * diagonal `i` is the corner opposite the vertex in the quad between edges `i`
 * and `i + 1`. An interior ring has as many edges as diagonals and wraps; a
 * boundary ring has one edge more and its first and last edges are the
 * boundary, at sharpness 10. The limit position and tangent masks of
 * Catmull-Clark read exactly these points.
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
