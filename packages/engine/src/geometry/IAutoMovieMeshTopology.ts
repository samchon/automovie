/**
 * What a mesh's triangle topology actually is, measured rather than assumed.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Reports the actual topology of authored mesh geometry.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Makes operation output topology explicit and inspectable.
 */
export interface IAutoMovieMeshTopology {
  /**
   * Triangle count, including degenerate ones.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Counts the faces present in the measured topology.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Reports the complete triangle population of an operation result.
   */
  triangles: number;
  /**
   * Triangles whose welded corners are not three distinct points.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-degenerate-geometry-refusal Identifies faces that collapse after positional welding.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures Exposes the degenerate output population for validation.
   */
  degenerate: number;
  /**
   * Zero-based triangle ordinals skipped by the same positional-weld rule.
   * A count cannot establish whether a later conversion lost a different face
   * while recovering an earlier redundant one; these identities preserve that
   * correspondence without reconstructing the weld calculation in a consumer.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-degenerate-geometry-refusal Identifies each face already redundant under positional welding so downstream conversion can distinguish it from newly lost geometry.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures Reports exact degenerate source-face identities for validation of the corresponding final output faces.
   */
  degenerateTriangles: number[];
  /**
   * Position, normal, or uv components that are not finite numbers.
   *
   * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation Measures numeric failures in mesh buffers.
   * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure Reports non-finite geometry components as structural evidence.
   */
  nonFinite: number;
  /**
   * Welded edges used by exactly one triangle: the open boundary.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Measures the open boundary of the authored surface.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Reports edges left with only one incident face.
   */
  boundaryEdges: number;
  /**
   * Welded edges used by three or more triangles.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Measures topology that cannot represent a manifold surface.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Reports edges with conflicting face incidence.
   */
  nonManifoldEdges: number;
  /**
   * True when every welded edge is shared by exactly two triangles.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology States whether the mesh forms a closed two-manifold.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Summarizes the closed-edge invariant of the result.
   */
  watertight: boolean;
  /**
   * Divergence-theorem signed volume; exact for a closed polyhedron.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Measures the orientation and enclosed volume of a closed mesh.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Exposes the signed-volume invariant of the operation output.
   */
  volume: number;
}
