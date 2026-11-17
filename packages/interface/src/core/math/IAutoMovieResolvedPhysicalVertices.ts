/**
 * Physical vertex identity of every render vertex in one mesh, returned by
 * `resolveAutoMovieMeshPhysicalVertices`.
 *
 * Render vertices that share an identity are one physical point split only
 * for rendering, such as at a UV or normal seam, so topology, deformation and
 * merge code treats them as a single vertex. Identities are dense ordinals
 * numbered in the order their first render vertex appears. Both arrays are new
 * for each call and owned by the caller.
 *
 * @evidence contracts/development/design.md#principled-representation A dense ordinal per render vertex plus one key per ordinal is the interned form of an equivalence relation, so equal identity means equal key and consumers compare integers instead of strings or positions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two parallel arrays with no per-vertex records, because consumers index identities by render vertex and only diagnostics and merge matching read the keys; the same shape is what `weldMeshVertices` returns when a mesh declares no correspondence.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A declared source point and a position-welded vertex never share a key, because their keys carry different prefixes, so an explicit declaration cannot be silently merged with a nearby undeclared vertex.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, what a shared identity means and who relies on it, the first-occurrence numbering, ownership, and per member the index space and each key form.
 */
export interface IAutoMovieResolvedPhysicalVertices {
  /**
   * Stable key of each identity, indexed by identity ordinal. A declared
   * source point reads `source:["<domain>",<id>]`. A vertex identified by
   * position reads `x,y,z` with each axis rounded to integer nanometres while
   * that index is a safe integer. Larger magnitudes use `=<metre coordinate>`
   * for that axis: adjacent binary64 values there exceed a nanometre and cannot
   * share a cell. The whole key is prefixed `legacy:` when the mesh declares
   * explicit source points for other vertices.
   */
  labels: string[];

  /**
   * Identity ordinal of each render vertex, in render vertex order, so its
   * length is the render vertex count.
   */
  vertices: number[];
}
