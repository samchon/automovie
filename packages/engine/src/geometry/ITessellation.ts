/**
 * Flat-array triangle mesh produced by tessellation: parallel `positions` /
 * `normals` (xyz triples) and triangle `indices`. This is the render-ready form
 * a renderer uploads to the GPU, and matches the shape of {@link IAutoMovieMesh}
 * (minus skinning).
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Carries the explicit triangle topology produced from named geometry.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Defines the parallel buffers of a tessellation result.
 */
export interface ITessellation {
  /**
   * Packed xyz vertex positions.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Carries the metric positions of generated vertices.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Exposes the concrete coordinates derived from named inputs.
   */
  positions: number[];
  /**
   * Packed xyz vertex normals parallel to {@link positions}.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Carries the surface orientation of each generated vertex.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Keeps normal and position buffers structurally aligned.
   */
  normals: number[];
  /**
   * Triangle indices into the packed vertex arrays.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Carries the face connectivity of the generated mesh.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Exposes the triangle topology over the parallel vertex buffers.
   */
  indices: number[];
}
