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
 * @evidence contracts/common.md#principled-implementation A dense ordinal per render vertex plus one key per ordinal is the interned form of an equivalence relation, so equal identity means equal key and consumers compare integers instead of strings or positions.
 * @evidence contracts/common.md#clear-and-simple-design Two parallel arrays with no per-vertex records, because consumers index identities by render vertex and only diagnostics and merge matching read the keys; the same shape is what `weldMeshVertices` returns when a mesh declares no correspondence.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A declared source point and a position-welded vertex never share a key, because their keys carry different prefixes, so an explicit declaration cannot be silently merged with a nearby undeclared vertex.
 * @evidence contracts/common.md#meaningful-documentation States the producer, what a shared identity means and who relies on it, the first-occurrence numbering, ownership, and per member the index space and each key form.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record with no runtime body; the interning cost is answered on `resolveAutoMovieMeshPhysicalVertices`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A fresh record per resolution of one mesh; reuse across consumers belongs to the callers that hold it.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One number per render vertex and one string per identity, owned by the caller with no reference kept by the producer.
 * @author Samchon
 */
export interface IAutoMovieResolvedPhysicalVertices {
  /**
   * Stable key of each identity, indexed by identity ordinal. A declared
   * source point reads `source:["<domain>",<id>]`. A vertex identified by
   * position reads its local coordinates rounded to whole nanometres, as
   * `x,y,z` integer nanometre counts, prefixed `legacy:` when the mesh declares source points
   * for other vertices.
   */
  labels: string[];

  /**
   * Identity ordinal of each render vertex, in render vertex order, so its
   * length is the render vertex count.
   */
  vertices: number[];
}
