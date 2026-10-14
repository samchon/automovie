import type { IAutoMovieMesh } from "@automovie/interface";

/** Emit the existing cells' exposed outward unit-square faces in their original order; split coordinates exercise exact positional welding, with owned buffers and no appearance attributes. */
export const createSignedVoxelUnion: (cells: number[][]) => IAutoMovieMesh = (cells: number[][]): IAutoMovieMesh => {
  const positions: number[] = [],
    indices: number[] = [];
  const occupied: Set<string> = new Set(cells.map((cell: number[]): string => cell.join(",")));
  for (const cell of cells)
    for (let axis: number = 0; axis < 3; axis++)
      for (const side of [-1, 1]) {
        const neighbor: number[] = cell.slice();
        neighbor[axis] += side;
        if (occupied.has(neighbor.join(","))) continue;
        const first: number = (axis + 1) % 3,
          second: number = (axis + 2) % 3;
        const base: number = positions.length / 3;
        for (const [u, v] of [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ]) {
          const point: number[] = cell.slice();
          point[axis] += (side + 1) / 2;
          point[first] += u;
          point[second] += v;
          positions.push(...point);
        }
        for (const triangle of [
          [0, 1, 2],
          [0, 2, 3],
        ])
          indices.push(
            ...(side === 1 ? triangle : triangle.slice().reverse()).map(
              (at: number): number => base + at,
            ),
          );
      }
  return { positions, indices, normals: null, uvs: null, skin: null };
};
