/**
 * Physical vertex identity of every render vertex in one mesh, returned by
 * `resolveAutoMovieMeshPhysicalVertices`.
 *
 * Render vertices that share an identity are one physical point split only for
 * rendering, such as at a UV or normal seam, so topology, deformation and merge
 * code treats them as a single vertex. Identities are dense ordinals numbered
 * in the order their first render vertex appears. Both arrays are new for each
 * call and owned by the caller.
 */
export interface IAutoMovieResolvedPhysicalVertices {
  /**
   * Stable key of each identity, indexed by identity ordinal. A declared source
   * point reads `source:["<domain>",<id>]`. A vertex identified by position
   * reads `x,y,z` with each axis rounded to integer nanometres while that index
   * is a safe integer. Larger magnitudes use `=<metre coordinate>` for that
   * axis: adjacent binary64 values there exceed a nanometre and cannot share a
   * cell. The whole key is prefixed `legacy:` when the mesh declares explicit
   * source points for other vertices.
   */
  labels: string[];

  /**
   * Identity ordinal of each render vertex, in render vertex order, so its
   * length is the render vertex count.
   */
  vertices: number[];
}
