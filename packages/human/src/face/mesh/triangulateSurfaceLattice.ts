
import type { IAutoMovieMesh } from "@automovie/interface";
import { Point } from "./structures/Point";
import { areaWeightedNormals as normalsOf } from "../../common/mesh/areaWeightedNormals";
/**
 * Sample a surface over [0,1] squared and triangulate its shared lattice.
 * The positive normal follows du cross dv. Closure belongs to the surface:
 * a tube without caps remains open, and coincident pole rows are not welded.
 */
export const triangulateSurfaceLattice = (
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