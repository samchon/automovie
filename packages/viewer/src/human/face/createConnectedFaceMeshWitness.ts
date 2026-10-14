import { createMeshPhysicalPartitionMatcher } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IConnectedFaceMeshWitness } from "./IConnectedFaceMeshWitness.js";

/**
 * Copy the exact source arrays of a face mesh that passed the Float32 and
 * manifold gates, with the closure obligation it was checked under and a
 * matcher for its physical vertex partition. A later frame whose arrays and
 * closure are equal reuses the verdict (`matchesConnectedFaceMeshWitness`).
 *
 * @evidence contracts/common.md#principled-implementation Copies positions, optional normals/indices/UVs and closure obligation and builds the canonical physical-partition matcher. The caller must have completed the current Float32/topology gates before calling; constructing this record does not run those gates itself.
 * @evidence contracts/common.md#clear-and-simple-design One retained numerical witness supports both validation reuse and resident static structure without allocating another native geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual admitted source elements and physical partition are retained rather than a hash, fixture count or inferred clinical verdict.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies copied source arrays, closure dependency, prior admission premise and the matcher that governs later equality.
 * @evidence contracts/performance.md#efficient-algorithms Copy work/storage scales with the four source buffers and physical matcher data; exact retention trades that memory for safe reuse of a previously completed gate.
 * @evidence contracts/performance.md#reuse-equivalent-work The matching owner compares all recorded dependencies before reusing a verdict. Color/appearance changes remain outside this geometry witness and are handled by static resident configuration.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The frame/resident owns copied witness data and matcher closure until its numerical references are released. No geometry, texture, worker or renderer handle is acquired.
 */
export function createConnectedFaceMeshWitness(
  mesh: IAutoMovieMesh,
  closed: boolean,
): IConnectedFaceMeshWitness {
  return {
    positions: mesh.positions.slice(),
    normals: mesh.normals?.slice() ?? null,
    indices: mesh.indices?.slice() ?? null,
    uvs: mesh.uvs?.slice() ?? null,
    closed,
    physical: createMeshPhysicalPartitionMatcher(mesh),
  };
}
