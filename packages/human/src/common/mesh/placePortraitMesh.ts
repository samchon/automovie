import {
  type IAutoMovieMeshTransform,
  inspectAutoMovieMeshTopology,
  transformAutoMovieMesh,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { assertDirection } from "./assertDirection";
import { triangleArea } from "./triangleArea";

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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-export Preserves each nonredundant face when a static part is placed for export.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-export Compares the engine's placed transform with its translation-free local transform, retaining mirror winding and refusing precision-driven face loss.
 */
export function placePortraitMesh(
  mesh: IAutoMovieMesh,
  transform: IAutoMovieMeshTransform,
): IAutoMovieMesh {
  const placed = transformAutoMovieMesh(mesh, transform);
  const sourceIndices =
    mesh.indices ??
    Array.from({ length: mesh.positions.length / 3 }, (_v, i) => i);
  const local: number[] = [];
  for (let face = 0; face < sourceIndices.length; face += 3) {
    const a = sourceIndices[face];
    local.push(0, 0, 0);
    for (const vertex of [sourceIndices[face + 1], sourceIndices[face + 2]])
      for (let axis = 0; axis < 3; axis++)
        local.push(
          mesh.positions[3 * vertex + axis] - mesh.positions[3 * a + axis],
        );
  }
  const reference = transformAutoMovieMesh(
    { positions: local, indices: null, normals: null, uvs: null, skin: null },
    { rotation: transform.rotation, scale: transform.scale },
  );
  const redundant = new Set(
    inspectAutoMovieMeshTopology(reference).degenerateTriangles,
  );
  for (let face = 0; face < placed.indices!.length; face += 3) {
    if (redundant.has(face / 3)) continue;
    assertDirection(
      triangleArea(reference.positions, reference.indices!, face),
      triangleArea(placed.positions, placed.indices!, face),
      face / 3,
      "placement",
    );
  }
  return placed;
}
