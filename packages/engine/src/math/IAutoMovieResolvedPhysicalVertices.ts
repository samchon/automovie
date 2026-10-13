/**
 * Physical vertex identity of every render vertex in one mesh.
 *
 * `vertices[i]` is the dense physical identity of render vertex i, interned in
 * first render occurrence order, and `labels[k]` is identity k's stable key: a
 * source domain/ID pair or a legacy nanometre-grid position key. Both arrays
 * are owned by the caller.
 *
 * @author Samchon
 */
export interface IAutoMovieResolvedPhysicalVertices {
  /** Stable key of each physical identity, indexed by identity ordinal. */
  labels: string[];

  /**
   * Physical identity ordinal of each render vertex, in render vertex order.
   */
  vertices: number[];
}
