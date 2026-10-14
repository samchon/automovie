import type { IAutoMovieMesh } from "@automovie/interface";

import type { IHumanFaceOralPart } from "./IHumanFaceOralPart";

/**
 * Assemble one physical arch sheet independently of its drawing materials. Gingiva and palate/floor are regions of one lining, and its vestibular wall shares the exact indexed outer rim. A material boundary cannot define an independent signed sheet: cutting triangles there can disconnect a vertex link even while the complete arch has a single manifold link.
 *
 * Only triangle-used points are assembled, by the lining owner's stable physical identities. Equal coordinates with different identities are not joined. One identity with differing coordinates refuses, so this operation cannot repair a gap, move a point or hide an inconsistent boundary. Source crown queries retain their independent numerical cervical closures; final performed lip strips remain soft tissue outside these rigid queries.
 *
 * @evidence contracts/common.md#principled-implementation Triangle-used non-enamel points join by stable physical identity into one complete rigid arch sheet.
 * @evidence contracts/common.md#clear-and-simple-design Material separation does not create separate signed sheets, and performed lip strips stay outside head/jaw queries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal coordinates with distinct ids stay separate while differing coordinates for one id refuse; no gap is repaired or point moved.
 * @evidence contracts/common.md#meaningful-documentation Output uses actual head-metre positions and optional observed ids match the assembled vertex order.
 * @evidence contracts/performance.md#efficient-algorithms Identity lookup and buffer gathering are linear in used triangle corners with map access.
 * @evidence contracts/performance.md#reuse-equivalent-work Each physical point is inserted once across arch material regions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned buffers/id snapshot are owned while source parts are borrowed; the local identity map is released after assembly.
 */
export function createHumanFaceOralArchQueryMesh(
  parts: readonly IHumanFaceOralPart[],
  owner: "head" | "jaw",
  observePointIds?: (ids: readonly string[]) => void,
): IAutoMovieMesh {
  const identities: Map<string, number> = new Map<string, number>();
  const positions: number[] = [],
    indices: number[] = [];
  for (const part of parts) {
    if (part.owner !== owner || part.materialRole === "enamel") continue;
    for (const vertex of part.mesh.indices!) {
      const identity: string = part.physicalPoints[vertex];
      if (identity === undefined)
        throw new Error(
          "Oral arch query needs every triangle point's physical identity.",
        );
      const point: number[] = part.mesh.positions.slice(
        3 * vertex,
        3 * vertex + 3,
      );
      let at: number | undefined = identities.get(identity);
      if (at === undefined) {
        at = identities.size;
        identities.set(identity, at);
        positions.push(...point);
      } else if (
        point.some(
          (value: number, axis: number): boolean =>
            value !== positions[3 * at! + axis],
        )
      )
        throw new Error(
          "Oral arch physical identity has inconsistent boundary coordinates: " +
            identity,
        );
      indices.push(at);
    }
  }
  if (indices.length === 0)
    throw new Error("Oral arch query needs its complete nonempty lining.");
  observePointIds?.([...identities.keys()]);
  return { positions, indices, normals: null, uvs: null, skin: null };
}
