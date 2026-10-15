import type { IAutoMovieMesh } from "@automovie/interface";


/** Empty indexed mesh with normal and UV arrays ready to append to. */
export const empty = (): IAutoMovieMesh => ({
  positions: [],
  normals: [],
  uvs: [],
  indices: [],
  skin: null,
});
