/**
 * What a mesh's triangle topology actually is, measured by
 * `inspectMeshTopology` rather than assumed.
 *
 * Corners are identified by position welded on the `AutoMovieEngineMeshWeldGrid` nanometre
 * grid, or, when the mesh declares physical vertices, by that physical identity
 * for edge incidence. This is a measurement, not a verdict:
 * `validateMeshTopology` judges the same surface and adds winding consistency
 * and an `expectClosed` declaration.
 */
export interface IAutoMovieMeshTopology {
  /** Triangle count, including degenerate ones. */
  triangles: number;

  /**
   * Triangles whose three welded corners are not three distinct grid points;
   * they are excluded from every edge count.
   */
  degenerate: number;

  /**
   * Zero-based ordinals of the degenerate triangles, in ascending order. A
   * count cannot establish whether a later conversion lost a different face
   * while recovering an earlier redundant one; these identities preserve that
   * correspondence without reconstructing the weld calculation in a consumer.
   */
  degenerateTriangles: number[];

  /** Edges of non-degenerate triangles used by exactly one triangle. */
  boundaryEdges: number;

  /** Edges of non-degenerate triangles used by three or more triangles. */
  nonManifoldEdges: number;

  /**
   * True when at least one edge exists and every edge is shared by exactly two
   * triangles; winding consistency is not checked here.
   */
  watertight: boolean;

  /**
   * Signed enclosed volume in cubic metres by the divergence theorem over all
   * triangles, positive for outward counter-clockwise winding; exact only for a
   * closed, consistently wound surface.
   */
  volume: number;
}
