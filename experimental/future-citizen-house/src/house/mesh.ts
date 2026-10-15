import type { IAutoMovieMesh } from "@automovie/interface";

/** One-triangle unit mesh in the z = 0 plane with full UVs, shared by the material measurement cases. */
export const mesh: IAutoMovieMesh = { positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], normals: [0, 0, 1, 0, 0, 1, 0, 0, 1], uvs: [0, 0, 1, 0, 0, 1], indices: [0, 1, 2], skin: null };
