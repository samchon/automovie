/**
 * Weights that place one refined vertex point from its parent neighbourhood.
 *
 * For an admitted fan, sum the parent position, the far ends of its fan edges
 * and its new face points with their respective weights. Edge and face arrays
 * follow the order in IAutoMovieSubdivisionTopology. The weights sum to one
 * before rounding.
 */
export interface IAutoMovieSubdivisionVertexMask {
  /** Weight of the parent vertex. */
  vertex: number;

  /** Weight of each fan edge's far end. */
  edges: number[];

  /** Weight of each fan face's new face point. */
  faces: number[];
}
