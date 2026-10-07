import type { createMeshPhysicalPartitionMatcher } from "@automovie/engine";

/**
 * Exact copies of the source arrays of one face mesh that passed the Float32
 * and manifold gates, so a later frame with the same arrays reuses the
 * verdict and a changed array takes the full gates again.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Lets an unchanged mesh reuse its Float32 and manifold verdict across edits.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Keeps exact source copies so a changed array takes the full gates again.
 * @author Samchon
 */
export interface IConnectedFaceMeshWitness {
  /** Source vertex positions, copied. */
  positions: readonly number[];

  /** Source normals, copied, or null when the mesh has none. */
  normals: readonly number[] | null;

  /** Source triangle indices, copied, or null for an unindexed mesh. */
  indices: readonly number[] | null;

  /** Source texture coordinates, copied, or null when the mesh has none. */
  uvs: readonly number[] | null;

  /** Whether the material binding required a closed surface. */
  closed: boolean;

  /** Matches the mesh's physical vertex partition. */
  physical: ReturnType<typeof createMeshPhysicalPartitionMatcher>;
}
