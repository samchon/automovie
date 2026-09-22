import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Small analytic solids for signed-distance tests. The octahedron is the unit
 * L1 ball. The voxel union emits only exposed, outward unit-square faces; shared
 * coordinates deliberately remain split to exercise exact positional welding.
 * Both functions return owned metre-space buffers and no appearance attributes.
 */
export const createSignedOctahedron = (x = 0): IAutoMovieMesh => ({
  positions: [1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1].map(
    (value, at) => value + (at % 3 === 0 ? x : 0),
  ),
  indices: [
    2, 4, 0, 2, 1, 4, 2, 5, 1, 2, 0, 5, 3, 0, 4, 3, 4, 1, 3, 1, 5, 3, 5, 0,
  ],
  normals: null,
  uvs: null,
  skin: null,
});

export const createSignedVoxelUnion = (cells: number[][]): IAutoMovieMesh => {
  const positions: number[] = [],
    indices: number[] = [];
  const occupied = new Set(cells.map((cell) => cell.join(",")));
  for (const cell of cells)
    for (let axis = 0; axis < 3; axis++)
      for (const side of [-1, 1]) {
        const neighbor = cell.slice();
        neighbor[axis] += side;
        if (occupied.has(neighbor.join(","))) continue;
        const first = (axis + 1) % 3,
          second = (axis + 2) % 3;
        const base = positions.length / 3;
        for (const [u, v] of [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
        ]) {
          const point = cell.slice();
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
              (at) => base + at,
            ),
          );
      }
  return { positions, indices, normals: null, uvs: null, skin: null };
};
