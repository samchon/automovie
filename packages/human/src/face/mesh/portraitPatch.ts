
import type { IAutoMovieMesh } from "@automovie/interface";
import { Point } from "./Point";
import { normalsOf } from "./normalsOf";
/**
 * Sample a surface over [0,1] squared and triangulate its shared lattice.
 * The positive normal follows du cross dv. Closure belongs to the surface:
 * a tube without caps remains open, and coincident pole rows are not welded.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Constructs connected sampled surfaces for ocular, oral and strand components.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Samples a shared unit-square lattice, emits du-cross-dv triangle winding and derives one common normal field.
 */
export const portraitPatch = (
  surface: (u: number, v: number) => Point,
  columns: number,
  rows: number,
): IAutoMovieMesh => {
  const positions: number[] = [],
    indices: number[] = [];
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i <= columns; i++) {
      const point = surface(i / columns, j / rows);
      positions.push(point.x, point.y, point.z);
    }
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < columns; i++) {
      const a = j * (columns + 1) + i;
      indices.push(
        a,
        a + 1,
        a + columns + 1,
        a + 1,
        a + columns + 2,
        a + columns + 1,
      );
    }
  return {
    positions,
    indices,
    normals: normalsOf(positions, indices),
    uvs: null,
    skin: null,
  };
};