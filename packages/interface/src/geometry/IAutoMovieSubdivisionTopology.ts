/**
 * Polygon rows, directed edge uses, and ordered vertex fans for one level.
 *
 * Faces are stored as compressed rows: face `f` owns corners `faceOffsets[f]`
 * to `faceOffsets[f + 1] - 1`, and corner `c` is vertex `faceVertices[c]`. A
 * corner's out-edge runs from its vertex to the next corner's. Every edge is
 * the out-edge of one corner per adjacent face: the first in corner order, then
 * the opposite one, or `-1` on a boundary.
 *
 * A vertex's fan lists its faces counterclockwise about the outward side, as
 * corners, and its edges between them: edge `i` is the out-edge of fan corner
 * `i`, and fan corner `i` lies between edges `i` and `i + 1`. An interior fan
 * is cyclic with as many edges as corners and starts at the vertex's
 * lowest-numbered corner; a boundary fan starts at the boundary edge leaving
 * the vertex and ends at the boundary edge entering it, one edge more than
 * corners.
 */
export interface IAutoMovieSubdivisionTopology {
  /** Number of vertices. */
  vertexCount: number;

  /** Compressed row starts and terminal offset for the face corner array. */
  faceOffsets: number[];

  /** Vertex of every corner. */
  faceVertices: number[];

  /** Face of every corner. */
  cornerFaces: number[];

  /** Out-edge of every corner. */
  cornerEdges: number[];

  /** Two end vertices per edge, in the direction of its first corner. */
  edgeVertices: number[];

  /**
   * Two corners per edge whose out-edge it is; the second is `-1` on a
   * boundary.
   */
  edgeCorners: number[];

  /** Sharpness per edge from 0 to 10; boundary edges are 10. */
  edgeSharpness: number[];

  /** Compressed row starts and terminal offset for the fan edge array. */
  fanEdgeOffsets: number[];

  /** Fan edges of every vertex in counter-clockwise order. */
  fanEdges: number[];

  /** Compressed row starts and terminal offset for the fan corner array. */
  fanCornerOffsets: number[];

  /** Fan corners of every vertex in counter-clockwise order. */
  fanCorners: number[];
}
