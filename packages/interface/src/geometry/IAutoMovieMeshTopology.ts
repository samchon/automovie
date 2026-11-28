/**
 * Triangle census, edge incidence and signed volume from a mesh's stored
 * buffers.
 */
export interface IAutoMovieMeshTopology {
  /**
   * Count of source triangles in the admitted index run, including
   * lattice-collapsed triangles.
   */
  triangles: number;

  /**
   * Count of triangles whose positions round onto fewer than three distinct
   * lattice cells. Their edges are excluded.
   */
  degenerate: number;

  /** Ascending zero-based source triangle ordinals for lattice-collapsed faces. */
  degenerateTriangles: number[];

  /**
   * Number of undirected welded edges used by exactly one noncollapsed
   * triangle.
   */
  boundaryEdges: number;

  /**
   * Number of undirected welded edges used more than twice by noncollapsed
   * triangles.
   */
  nonManifoldEdges: number;

  /**
   * True when a nonempty welded edge set has exactly two uses per edge. This is
   * the edge-incidence measure.
   */
  watertight: boolean;

  /**
   * Signed sum of origin tetrahedron volumes from stored triangles, in cubic
   * metres. A finite, closed, consistently wound surface gives the enclosed
   * volume with its winding sign.
   *
   * Supply finite positions with representable tetrahedral products for a
   * finite measurement.
   */
  volume: number;
}
