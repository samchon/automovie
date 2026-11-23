/**
 * Weights that place one refined vertex point from its parent neighbourhood.
 *
 * The point is `vertex` times the parent vertex, plus `edges[i]` times the far
 * end of the vertex's fan edge `i`, plus `faces[i]` times the new face point of
 * its fan face `i`, in the order of `ISubdivisionTopology`'s fans. The weights
 * sum to one.
 */
export interface IAutoMovieSubdivisionVertexMask {
  /** Weight of the parent vertex. */
  vertex: number;

  /** Weight of each fan edge's far end. */
  edges: number[];

  /** Weight of each fan face's new face point. */
  faces: number[];
}
