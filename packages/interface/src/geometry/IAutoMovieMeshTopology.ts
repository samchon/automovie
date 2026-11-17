/**
 * What a mesh's triangle topology actually is, measured by
 * `inspectAutoMovieMeshTopology` rather than assumed.
 *
 * Corners are identified by position welded on the `MESH_WELD_GRID` nanometre
 * grid, or, when the mesh declares physical vertices, by that physical
 * identity for edge incidence. This is a measurement, not a verdict:
 * `validateMeshTopology` judges the same surface and adds winding consistency
 * and an `expectClosed` declaration.
 *
 * @evidence contracts/development/design.md#principled-representation Edge counts come from an undirected edge map over welded or physical corner identities, so a seam split for UVs still counts as one edge, and volume is the divergence-theorem sum of signed tetrahedra against the origin, exact for any closed consistently wound polyhedron.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Plain counts plus the degenerate ordinals and the volume, the facts a builder, the human part census and the portrait mesh placement read, while pass or fail stays with `validateMeshTopology`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Degenerate triangles are listed and left out of the edge map rather than repaired, and an empty or fully degenerate mesh reports not watertight instead of passing vacuously.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, how corners are identified with and without physical vertices, which attribute buffers the non-finite count covers, which triangles each count excludes, the watertight condition including the empty case, and the volume's unit and sign.
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
   * Zero-based ordinals of the degenerate triangles, in ascending order.
   * A count cannot establish whether a later conversion lost a different face
   * while recovering an earlier redundant one; these identities preserve that
   * correspondence without reconstructing the weld calculation in a consumer.
   */
  degenerateTriangles: number[];

  /**
   * Components of the position, normal, UV, colour and relief-weight buffers
   * that are not finite numbers.
   */
  nonFinite: number;

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
