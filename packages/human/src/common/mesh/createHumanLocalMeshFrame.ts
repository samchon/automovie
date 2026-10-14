import { weldedDegenerateTriangles } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IHumanLocalMeshFrame } from "./IHumanLocalMeshFrame";
import { assertDirection } from "./assertDirection";
import { float32MeshBuffers } from "./float32MeshBuffers";
import { triangleAreaVector } from "./triangleAreaVector";

/**
 * Prepare one static mesh for ordinary local-coordinate publication.
 * Each axis uses its finite bounding midpoint when subtraction and addition
 * reconstruct every supplied coordinate under numeric equality; otherwise that axis
 * keeps origin zero. This chooses a coordinate frame, never a vertex merge
 * or a geometric tolerance. Signed zeros compare equal under this admission.
 * The original redundancy classification remains
 * authoritative through translation and the strict Float32 conversion.
 *
 * @evidence contracts/common.md#principled-implementation Finite bounding midpoints become origin components only when subtract/add reconstructs every coordinate under numeric equality, which equates signed zeros; otherwise zero is kept. Original face direction/redundancy and both source/local Float32 policies remain authoritative.
 * @evidence contracts/common.md#clear-and-simple-design The owner chooses a publication frame while engine redundancy, assertDirection and float32MeshBuffers retain their canonical admission rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Zero fallback follows exact reconstruction rather than tolerance/expected placement; conversion refusals are combined and rethrown, not swallowed.
 * @evidence contracts/common.md#meaningful-documentation The prose gives exact midpoint policy, retained incidence and independent Float32 reference obligations.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices and T faces, midpoint/reconstruction/translation/direction work is linear; two delegated weld/Float32 policies add their input-sized costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Origin decisions are reused for translation/diagnostics, but source/local redundancy policies are separately checked because changing origin does not prove equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned frame retains borrowed source/attributes and new positions; validation temporaries expire on return/refusal without persistent caches or tasks.
 */
export function createHumanLocalMeshFrame(
  source: IAutoMovieMesh,
  identity: string,
): IHumanLocalMeshFrame {
  if (source.positions.length % 3 !== 0 || !source.positions.every(Number.isFinite))
    throw new Error("A local mesh frame needs finite complete XYZ triples.");
  const shifts: number[] = [0, 0, 0];
  for (let axis: number = 0; axis < 3; axis++) {
    let minimum: number = Infinity;
    let maximum: number = -Infinity;
    for (let at: number = axis; at < source.positions.length; at += 3) {
      minimum = Math.min(minimum, source.positions[at]);
      maximum = Math.max(maximum, source.positions[at]);
    }
    if (minimum === Infinity) continue;
    const candidate: number = minimum / 2 + maximum / 2;
    let exact: boolean = true;
    for (let at: number = axis; at < source.positions.length; at += 3)
      if ((source.positions[at] - candidate) + candidate !== source.positions[at]) {
        exact = false;
        break;
      }
    if (exact) shifts[axis] = candidate;
  }
  const mesh: IAutoMovieMesh = {
    ...source,
    positions: source.positions.map((value: number, at: number): number => value - shifts[at % 3]),
  };
  const indices: number[] = source.indices ?? Array.from(
    { length: source.positions.length / 3 }, (_value: unknown, at: number): number => at,
  );
  const redundant: Set<number> = new Set(weldedDegenerateTriangles(source));
  for (let at: number = 0; at < indices.length; at += 3)
    if (!redundant.has(at / 3))
      assertDirection(
        triangleAreaVector(source.positions, indices, at),
        triangleAreaVector(mesh.positions, indices, at),
        at / 3,
        "local-frame translation",
      );
  const origin: IHumanLocalMeshFrame["origin"] = { x: shifts[0], y: shifts[1], z: shifts[2] };
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
