import type { IAutoMovieMesh } from "@automovie/interface";
import type { IHumanMeshNormalRefusal } from "./IHumanMeshNormalRefusal";
import { triangleAreaVector } from "./triangleAreaVector";

/**
 * Read all failing normals at the existing Float32 boundary. Incident faces,
 * original directions and physical identities belong to the actual mesh.
 * Area sums describe this resident mesh only; a shared normal's construction
 * population can be larger. No direction, topology or admission changes.
 *
 * @evidence contracts/common.md#principled-implementation Reads the unchanged failed vertex population and sums the actual winding-based triangle area vectors at those vertices.
 * @evidence contracts/common.md#clear-and-simple-design One read-only diagnostic owns normal and local incidence context for the existing guard.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No normalization, fallback direction or vertex deletion occurs.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes local diagnostic area from a potentially larger shared normal construction.
 */
export function readHumanMeshNormalRefusals(
  mesh: IAutoMovieMesh,
  normals: Float32Array,
  indices: Uint32Array,
): IHumanMeshNormalRefusal[] {
  const failures: IHumanMeshNormalRefusal[] = [];
  for (let at = 0; at < normals.length; at += 3) {
    const direction = Array.from(normals.slice(at, at + 3));
    const length = Math.hypot(...direction);
    if (Math.abs(length - 1) <= 2 ** -23) continue;
    const vertex = at / 3;
    const alias = mesh.physicalVertices?.vertices[vertex];
    failures.push({ vertex, original: mesh.normals!.slice(at, at + 3), float32: direction,
      length, faces: [], areaSum: [0, 0, 0], faceAreas: [], facePositions: [], physical: alias === undefined || alias === null
        ? null : mesh.physicalVertices!.sources[alias] ?? null });
  }
  const byVertex = new Map(failures.map((failure) => [failure.vertex, failure]));
  for (let at = 0; at < indices.length; at += 3) {
    const area = triangleAreaVector(mesh.positions, indices, at);
    for (const vertex of new Set(Array.from(indices.slice(at, at + 3)))) {
      const failure = byVertex.get(vertex);
      if (failure === undefined) continue;
      failure.faces.push(at / 3);
      failure.faceAreas.push([area.x, area.y, area.z]);
      failure.facePositions.push(Array.from(indices.slice(at, at + 3)).flatMap((corner) => mesh.positions.slice(3 * corner, 3 * corner + 3)));
      failure.areaSum[0] += area.x;
      failure.areaSum[1] += area.y;
      failure.areaSum[2] += area.z;
    }
  }
  return failures;
}
