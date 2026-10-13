import { createMeshPhysicalPartitionMatcher } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IConnectedFaceMeshWitness } from "./IConnectedFaceMeshWitness.js";

/**
 * Copy the exact source arrays of a face mesh that passed the Float32 and
 * manifold gates, with the closure obligation it was checked under and a
 * matcher for its physical vertex partition. A later frame whose arrays and
 * closure are equal reuses the verdict (`matchesConnectedFaceMeshWitness`).
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
