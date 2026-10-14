import type { IAutoMovieMesh } from "@automovie/interface";

/** Build the existing unit L1 ball shifted along X, with owned metre-space buffers and no appearance attributes. */
export const createSignedOctahedron: (x?: number) => IAutoMovieMesh = (x: number = 0): IAutoMovieMesh => ({
  positions: [1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1].map(
    (value: number, at: number): number => value + (at % 3 === 0 ? x : 0),
  ),
  indices: [
    2, 4, 0, 2, 1, 4, 2, 5, 1, 2, 0, 5, 3, 0, 4, 3, 4, 1, 3, 1, 5, 3, 5, 0,
  ],
  normals: null,
  uvs: null,
  skin: null,
});
