import { createMeshPhysicalPartitionMatcher } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IConnectedFaceMeshWitness } from "./IConnectedFaceMeshWitness";

/**
 * Copy the exact source arrays of a face mesh that passed the Float32 and
 * manifold gates, with the closure obligation it was checked under and a
 * matcher for its physical vertex partition. A later frame whose arrays and
 * closure are equal reuses the verdict (`matchesConnectedFaceMeshWitness`).
 *
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Keeps the certified arrays so an unchanged mesh is not re-gated and a changed one always is.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Records a mesh that passed the gates so an unchanged later frame keeps its verdict.
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
