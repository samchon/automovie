import type { IAutoMovieMeshTarget } from "@automovie/interface";

/*
 * Create four new, empty attribute buffers for a flat-shaded procedural builder
 * to append to.
 *
 * Each call returns arrays no other caller holds, so two builders running in
 * one call stack never write into each other's mesh. The builder returns the
 * filled target as its mesh, handing the arrays over without a copy.
 * Returns: Empty positions, normals, UVs and indices.
 */
export const emptyMeshTarget = (): IAutoMovieMeshTarget => ({
  positions: [],
  normals: [],
  uvs: [],
  indices: [],
});
