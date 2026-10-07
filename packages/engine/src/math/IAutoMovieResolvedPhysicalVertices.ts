/**
 * Physical vertex identity of every render vertex in one mesh.
 *
 * `vertices[i]` is the dense physical identity of render vertex i, interned in
 * first render occurrence order, and `labels[k]` is identity k's stable key: a
 * source domain/ID pair or a legacy nanometre-grid position key. Both arrays
 * are owned by the caller.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Names the source-point incidence that is resolved independently of contact while retaining current-coordinate legacy incidence.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Represents interned physical identities without allocating by opaque ID magnitude.
 * @author Samchon
 */
export interface IAutoMovieResolvedPhysicalVertices {
  /**
   * Stable key of each physical identity, indexed by identity ordinal.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Distinguishes explicit source points from legacy position-grid identities.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Keys source identities by domain and ID rather than by table order.
   */
  labels: string[];

  /**
   * Physical identity ordinal of each render vertex, in render vertex order.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Gives topology consumers one incidence per physical point.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Interns identities in first render occurrence order.
   */
  vertices: number[];
}
