import type { IAutoMovieMesh } from "@automovie/interface";

import type { IHumanMeshNormalRefusal } from "./IHumanMeshNormalRefusal";
import { triangleAreaVector } from "./triangleAreaVector";

/**
 * Read all failing normals at the existing Float32 boundary. Incident faces,
 * original directions and physical identities belong to the actual mesh.
 * Area sums describe this resident mesh only; a shared normal's construction
 * population can be larger. No direction, topology or admission changes.
 *
 * @evidence contracts/common.md#principled-implementation Resident normals outside the existing Float32 epsilon are recorded with actual directions, incident faces and physical lineage; resident area sums do not certify the larger construction population.
 * @evidence contracts/common.md#clear-and-simple-design The reader collects diagnostics without changing direction/topology/admission, reusing triangleAreaVector.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No repaired normal, guessed source, fitted area or specimen exception replaces failing values.
 * @evidence contracts/common.md#meaningful-documentation The prose states complete normal inspection, real source identities, incident-area limits and unchanged admission.
 * @evidence contracts/performance.md#efficient-algorithms For V normals, T faces and F failures, scan plus indexed incident accumulation cost O(V+T) expected work and O(F+incident data) space; each face area is computed once.
 * @evidence contracts/performance.md#reuse-equivalent-work A by-vertex Map routes faces to failures and one area vector serves all corners, avoiding an all-face rescan for every failed normal.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Copied failure/incident data transfers while the temporary Map/Sets expire; source records remain borrowed without handles/tasks.
 */
export function readHumanMeshNormalRefusals(
  mesh: IAutoMovieMesh,
  normals: Float32Array,
  indices: Uint32Array,
): IHumanMeshNormalRefusal[] {
  const failures: IHumanMeshNormalRefusal[] = [];
  for (let at: number = 0; at < normals.length; at += 3) {
    const direction: number[] = Array.from(normals.slice(at, at + 3));
    const length: number = Math.hypot(...direction);
    if (Math.abs(length - 1) <= 2 ** -23) continue;
    const vertex: number = at / 3;
    const alias: number | null | undefined =
      mesh.physicalVertices?.vertices[vertex];
    failures.push({
      vertex,
      original: mesh.normals!.slice(at, at + 3),
      float32: direction,
      length,
      faces: [],
      areaSum: [0, 0, 0],
      faceAreas: [],
      facePositions: [],
      physical:
        alias === undefined || alias === null
          ? null
          : (mesh.physicalVertices!.sources[alias] ?? null),
    });
  }
  const byVertex: Map<number, IHumanMeshNormalRefusal> = new Map(
    failures.map(
      (failure: IHumanMeshNormalRefusal): [number, IHumanMeshNormalRefusal] => [
        failure.vertex,
        failure,
      ],
    ),
  );
  for (let at: number = 0; at < indices.length; at += 3) {
    const area: ReturnType<typeof triangleAreaVector> = triangleAreaVector(
      mesh.positions,
      indices,
      at,
    );
    for (const vertex of new Set(Array.from(indices.slice(at, at + 3)))) {
      const failure: IHumanMeshNormalRefusal | undefined = byVertex.get(vertex);
      if (failure === undefined) continue;
      failure.faces.push(at / 3);
      failure.faceAreas.push([area.x, area.y, area.z]);
      failure.facePositions.push(
        Array.from(indices.slice(at, at + 3)).flatMap(
          (corner: number): number[] =>
            mesh.positions.slice(3 * corner, 3 * corner + 3),
        ),
      );
      failure.areaSum[0] += area.x;
      failure.areaSum[1] += area.y;
      failure.areaSum[2] += area.z;
    }
  }
  return failures;
}
