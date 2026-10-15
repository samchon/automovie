import { type IAutoMovieSubdivisionCage } from "@automovie/engine";

/**
 * A synthetic open quad grid of `columns` by `rows` unit cells in the XY plane,
 * lifted by `height(i, j)`. Vertex `(i, j)` has index `j * (columns + 1) + i`
 * and face `(i, j)` has index `j * columns + i`, wound counter-clockwise about
 * +Z with corner 0 at `(i, j)` and corner 1 at `(i + 1, j)`.
 */
export function subdivisionGrid(
  columns: number,
  rows: number,
  height: (i: number, j: number) => number,
): IAutoMovieSubdivisionCage {
  const positions: number[] = [];
  for (let j: number = 0; j <= rows; ++j)
    for (let i: number = 0; i <= columns; ++i)
      positions.push(i, j, height(i, j));
  const faces: number[][] = [];
  const at: (i: number, j: number) => number = (i: number, j: number): number =>
    j * (columns + 1) + i;
  for (let j: number = 0; j < rows; ++j)
    for (let i: number = 0; i < columns; ++i)
      faces.push([at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)]);
  return { positions, faces };
}
