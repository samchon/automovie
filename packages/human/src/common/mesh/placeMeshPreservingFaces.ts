import {
  type IAutoMovieMeshTransform,
  inspectAutoMovieMeshTopology,
  transformAutoMovieMesh,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import { assertDirection } from "./assertDirection";
import { triangleAreaVector } from "./triangleAreaVector";

/**
 * Place each source face without losing it to a large translation's precision.
 * Each face also travels through the same engine transform in its own
 * translation-free frame: (0, b-a, c-a). This reference carries the intended
 * linear shape, scale and mirror winding without another TRS implementation.
 * It is validation data, never an exported second surface.
 *
 * Redundancy is classified after that linear scale. A sub-weld source edge can
 * become meaningful when enlarged, and must not then disappear merely because
 * its placed origin is huge. Conversely an intentionally shrunken redundant
 * pole follows the existing engine policy at its actual metric scale.
 *
 * @evidence contracts/common.md#principled-implementation Actual placement is compared to per-face translation-free references transformed by the same engine linear TRS; redundancy is classified at scaled metric size and remaining faces preserve orientation under large-origin precision.
 * @evidence contracts/common.md#clear-and-simple-design Engine transform/topology retain their laws and this wrapper supplies an independent local reference without a second TRS formula.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Large translations or original sub-weld scale do not silently remove an enlarged meaningful face; reference geometry is diagnostic rather than exported output.
 * @evidence contracts/common.md#meaningful-documentation The prose explains translation-free comparison, scale-dependent redundancy and source-face preservation.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices and T faces, two transforms/topology/face checks cost O(V+T) plus topology-owner work; reference storage has three local vertices per triangle.
 * @evidence contracts/performance.md#reuse-equivalent-work One canonical transform serves actual/reference paths and one redundancy Set serves all comparisons rather than repeated topology scans per face.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Placed mesh transfers on success; local/reference arrays and classification state expire on completion/refusal with no source handle or persistent task.
 */
export function placeMeshPreservingFaces(
  mesh: IAutoMovieMesh,
  transform: IAutoMovieMeshTransform,
): IAutoMovieMesh {
  const placed: IAutoMovieMesh = transformAutoMovieMesh(mesh, transform);
  const sourceIndices: number[] =
    mesh.indices ??
    Array.from({ length: mesh.positions.length / 3 }, (_value: unknown, i: number): number => i);
  const local: number[] = [];
  for (let face: number = 0; face < sourceIndices.length; face += 3) {
    const a: number = sourceIndices[face];
    local.push(0, 0, 0);
    for (const vertex of [sourceIndices[face + 1], sourceIndices[face + 2]])
      for (let axis: number = 0; axis < 3; axis++)
        local.push(
          mesh.positions[3 * vertex + axis] - mesh.positions[3 * a + axis],
        );
  }
  const reference: IAutoMovieMesh = transformAutoMovieMesh(
    { positions: local, indices: null, normals: null, uvs: null, skin: null },
    { rotation: transform.rotation, scale: transform.scale },
  );
  const redundant: Set<number> = new Set(
    inspectAutoMovieMeshTopology(reference).degenerateTriangles,
  );
  for (let face: number = 0; face < placed.indices!.length; face += 3) {
    if (redundant.has(face / 3)) continue;
    assertDirection(
      triangleAreaVector(reference.positions, reference.indices!, face),
      triangleAreaVector(placed.positions, placed.indices!, face),
      face / 3,
      "placement",
    );
  }
  return placed;
}
