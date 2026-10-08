import { weldedDegenerateTriangles } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IHumanLocalMeshFrame } from "./IHumanLocalMeshFrame";
import { assertDirection } from "./assertDirection";
import { float32MeshBuffers } from "./float32MeshBuffers";
import { triangleAreaVector } from "./triangleAreaVector";

/**
 * Prepare one static mesh for ordinary local-coordinate publication.
 * Each axis uses its finite bounding midpoint when subtraction and addition
 * reconstruct every supplied binary64 value exactly; otherwise that axis
 * keeps origin zero. This chooses a coordinate frame, never a vertex merge
 * or a geometric tolerance. The original redundancy classification remains
 * authoritative through translation and the strict Float32 conversion.
 *
 * @evidence contracts/common.md#principled-implementation Exact reconstruction and source-face direction checks precede the existing local Float32 guard.
 * @evidence contracts/common.md#clear-and-simple-design One owner chooses the origin and prepares its immutable local mesh.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No nearby point, small face or failed orientation is removed or exempted.
 * @evidence contracts/common.md#meaningful-documentation States exact reconstruction, zero-origin axes and source redundancy ownership.
 * @evidence contracts/modeling.md#spatial-conventions A compensating translation preserves the supplied metre-frame geometry.
 * @evidence contracts/modeling.md#shared-boundaries Vertex order, indices and physical source correspondence survive unchanged.
 * @evidence contracts/modeling.md#emitted-geometry Preserves every input vertex and nonredundant triangle.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The caller retains its existing part identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#rendered-observation The actual viewport and export own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Introduces no anatomical dimension.
 * @evidenceExclude contracts/anatomy.md#permitted-range Physical predicates remain with their owners.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Changes no personal input.
 */
export function createHumanLocalMeshFrame(
  source: IAutoMovieMesh,
  identity: string,
): IHumanLocalMeshFrame {
  if (source.positions.length % 3 !== 0 || !source.positions.every(Number.isFinite))
    throw new Error("A local mesh frame needs finite complete XYZ triples.");
  const shifts = [0, 0, 0];
  for (let axis = 0; axis < 3; axis++) {
    let minimum = Infinity, maximum = -Infinity;
    for (let at = axis; at < source.positions.length; at += 3) {
      minimum = Math.min(minimum, source.positions[at]);
      maximum = Math.max(maximum, source.positions[at]);
    }
    if (minimum === Infinity) continue;
    const candidate = minimum / 2 + maximum / 2;
    let exact = true;
    for (let at = axis; at < source.positions.length; at += 3)
      if ((source.positions[at] - candidate) + candidate !== source.positions[at]) {
        exact = false;
        break;
      }
    if (exact) shifts[axis] = candidate;
  }
  const mesh: IAutoMovieMesh = {
    ...source,
    positions: source.positions.map((value, at) => value - shifts[at % 3]),
  };
  const indices = source.indices ?? Array.from(
    { length: source.positions.length / 3 }, (_, at) => at,
  );
  const redundant = new Set(weldedDegenerateTriangles(source));
  for (let at = 0; at < indices.length; at += 3)
    if (!redundant.has(at / 3))
      assertDirection(
        triangleAreaVector(source.positions, indices, at),
        triangleAreaVector(mesh.positions, indices, at),
        at / 3,
        "local-frame translation",
      );
  const origin = { x: shifts[0], y: shifts[1], z: shifts[2] };
  let originalSource: string | undefined;
  let publicationLocal: string | undefined;
  try {
    float32MeshBuffers(mesh, identity, source, origin);
  } catch (error) {
    originalSource = error instanceof Error ? error.message : String(error);
  }
  // The producer's original-source policy and the existing viewer's local
  // policy remain independently authoritative. Neither weld-grid face set
  // substitutes for the other after changing the coordinate origin.
  try {
    float32MeshBuffers(mesh, identity);
  } catch (error) {
    publicationLocal = error instanceof Error ? error.message : String(error);
  }
  if (originalSource !== undefined || publicationLocal !== undefined)
    throw new Error((originalSource ?? publicationLocal)! +
      " local-frame-guards:" + JSON.stringify({
        originalSource: originalSource ?? null,
        publicationLocal: publicationLocal ?? null,
        originalRedundantTriangles: [...redundant],
        publicationLocalRedundantTriangles: weldedDegenerateTriangles(mesh),
        origin,
      }));
  return { source, origin, mesh };
}
