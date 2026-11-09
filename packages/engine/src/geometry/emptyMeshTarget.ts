import { IAutoMovieMeshTarget } from "./IAutoMovieMeshTarget";

/**
 * Create four new, empty attribute buffers for a flat-shaded procedural
 * builder to append to.
 *
 * Each call returns arrays no other caller holds, so two builders running in
 * one call stack never write into each other's mesh. The builder returns the
 * filled target as its mesh, handing the arrays over without a copy.
 *
 * @returns Empty positions, normals, UVs and indices.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Fresh array literals per call give each builder exclusive ownership of its buffers, which the builders rely on when they spread the target into their result.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A factory for `IAutoMovieMeshTarget` shared by the region extruder and the loft, so both start from the same four buffers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No shared or module-level buffer is reused, which would leak one mesh's vertices into the next.
 * @evidence contracts/development/common.md#meaningful-documentation States that the buffers are exclusive per call and that the builder hands them over uncopied.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Allocates four empty arrays; there is no algorithm to choose.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Sharing buffers across builder calls would alias their meshes, so every call must allocate.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing itself; the builder that called it owns the buffers and transfers them to its returned mesh.
 */
export const emptyMeshTarget = (): IAutoMovieMeshTarget => ({
  positions: [],
  normals: [],
  uvs: [],
  indices: [],
});
