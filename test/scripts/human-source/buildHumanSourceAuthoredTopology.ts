import { compactHumanSourceTopology } from "./compactHumanSourceTopology.ts";
import { convertHumanSourceCoordinates } from "./convertHumanSourceCoordinates.ts";
import type { IHumanSourceAuthoredCell } from "./structures/IHumanSourceAuthoredCell.ts";
import type { IHumanSourceCompactedTopology } from "./structures/IHumanSourceCompactedTopology.ts";

/**
 * Form the provider's canonical parent tree from actual native cells and UVs.
 * The provider owns each cell's orientation and cap triangulation. Original
 * quad fans retain the sampling convention; already-triangulated authored
 * caps are preserved, not refitted. Source conversion and active compaction
 * use their shared owners, while ordered cell incidence survives reindexing.
 * Closure, embedding, motion, biological fit and appearance remain downstream.
 */
export function buildHumanSourceAuthoredTopology(
  native: Float64Array,
  cells: readonly IHumanSourceAuthoredCell[],
  offset: number,
): IHumanSourceCompactedTopology {
  const triangles: number[] = [];
  const cornerUv: number[] = [];
  const ids = new Set<string>();
  for (const cell of cells) {
    if (
      cell.id.trim() === "" ||
      ids.has(cell.id) ||
      cell.vertices.length < 3 ||
      cell.cornerUV.length !== cell.vertices.length ||
      cell.vertices.some(
        (vertex) =>
          !Number.isSafeInteger(vertex) ||
          vertex < 0 ||
          3 * vertex + 2 >= native.length,
      ) ||
      new Set(cell.vertices).size !== cell.vertices.length ||
      cell.cornerUV.some(
        (uv) => uv.length !== 2 || uv.some((value) => !Number.isFinite(value)),
      )
    )
      throw new Error(
        `Authored source cell ${cell.id} lacks distinct oriented native corners and matching UVs.`,
      );
    ids.add(cell.id);
    for (let at = 1; at < cell.vertices.length - 1; at++)
      for (const corner of [0, at, at + 1]) {
        triangles.push(cell.vertices[corner]);
        cornerUv.push(cell.cornerUV[corner][0], 1 - cell.cornerUV[corner][1]);
      }
  }
  return compactHumanSourceTopology({
    offset,
    vertexCount: native.length / 3,
    positions: convertHumanSourceCoordinates(native, offset),
    triangles: Int32Array.from(triangles),
    cornerUv: Float64Array.from(cornerUv),
  });
}
