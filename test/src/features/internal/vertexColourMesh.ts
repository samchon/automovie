import type { IAutoMovieMesh } from "@automovie/interface";

/** Return the existing finite +Z triangle with binary-fraction RGB multipliers; each call owns fresh attribute arrays. */
export function vertexColourMesh(): IAutoMovieMesh {
  return {
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
    uvs: null,
    indices: [0, 1, 2],
    skin: null,
    colors: [1, 0, 0.5, 0.25, 1, 0, 0, 0.5, 1],
  };
}
