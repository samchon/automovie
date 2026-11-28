import {
  IAutoMovieMesh,
  type IAutoMoviePrimitiveShape,
  type IAutoMovieTessellation,
} from "@automovie/interface";

import { tessellate } from "./tessellate";

/*
 * Tessellate a primitive and wrap it as a complete IAutoMovieMesh.
 *
 * The mesh is indexed, carries the primitive's own normals, and has no UVs and
 * no skin, because a primitive states no atlas and rides its part's bone as a
 * rigid whole. Callers use it where a mesh is required, such as placing a
 * primitive with transformMesh or merging it with authored
 * parts.
 * Parameter shape: Primitive to tessellate.
 * Returns: A new mesh whose arrays are owned by the caller.
 * Uses the same admission and geometry as tessellate.
 */
export const tessellateToMesh: (
  shape: IAutoMoviePrimitiveShape,
) => IAutoMovieMesh = (shape: IAutoMoviePrimitiveShape): IAutoMovieMesh => {
  const tessellation: IAutoMovieTessellation = tessellate(shape);
  return {
    positions: tessellation.positions,
    normals: tessellation.normals,
    uvs: null,
    indices: tessellation.indices,
    skin: null,
  };
};
