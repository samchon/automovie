/**
 * One material region in an exact partition of a face surface's triangles.
 *
 * The regions of a surface preserve its oriented triples, so connectivity and
 * normals stay owned by the surface across material and UV seams.
 *
 * @evidence contracts/common.md#principled-implementation Exact oriented parent-surface incidence and resident material identity partition rendering while shared connectivity/normals remain surface-owned; corner UVs retain separate seams.
 * @evidence contracts/common.md#clear-and-simple-design Identity, material, surface indices and corner UVs describe a material view rather than another independently authored surface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Basis admission rejects omitted/duplicate/reversed parent triangles; a UV seam authorizes no coordinate-based physical welding.
 * @evidence contracts/common.md#meaningful-documentation The comment states physical ownership and members distinguish vertex indices from per-corner UVs and null untextured state.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface runs no triangle partition or UV gather algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared incidence describes correspondence; normal/gather reuse belongs to geometry producers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The surface owns region arrays; this type opens no finish or texture handle.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisRegion {
  /** Region identity, unique within its surface. */
  id: string;

  /** ID of the resident material this region renders with. */
  material: string;

  /** Oriented triangle corners, each a vertex index of the surface. */
  indices: number[];

  /** Flat UV pairs per triangle corner, or null for untextured geometry. */
  uvs: number[] | null;
}
