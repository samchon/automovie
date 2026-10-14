import type { createMeshPhysicalPartitionMatcher } from "@automovie/engine";

/**
 * Exact copies of the source arrays of one face mesh that passed the Float32
 * and manifold gates, so a later frame with the same arrays reuses the
 * verdict and a changed array takes the full gates again.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Exact source array copies, closure flag and canonical physical-partition matcher bind one previously checked mesh to its Float32/topology verdict. Only current arrays equal to those copies and the same closure requirement can reuse that verdict; color/material appearance is a separate boundary.
 * @evidence contracts/common.md#clear-and-simple-design One witness supplies validation equivalence and immutable static indices/UVs to the resident structure, avoiding a second serialized copy of large buffers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual array elements and physical partition meaning are checked rather than a source/prose fingerprint or fixture geometry count. Witnesses describe numerical admission, not clinical validity or rendered pixels.
 * @evidence contracts/common.md#meaningful-documentation Fields state copied arrays, null optional buffers, closure obligation and physical matcher purpose; callers must not mutate their exposed arrays through an unsafe cast.
 * @evidence contracts/performance.md#efficient-algorithms Copy and comparison costs scale with positions, normals, indices, UVs and physical partition size; storing exact inputs avoids collision-prone hashes but retains those full arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work A matching mesh reuses the already completed geometry gate only while every recorded dependency agrees. Changed array or closure obligation triggers full Float32/topology evaluation in prepare.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Witness data and matcher closures remain with prepared frames/current residents and own no GPU handle. Their memory scales with retained mesh buffers; resident/frame release ends retention when callers relinquish references.
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
