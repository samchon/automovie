import { AutoMoviePrimitiveShape, IAutoMovieMesh } from "@automovie/interface";

import { tessellate } from "./tessellate";

/** Tessellate, then wrap as a full {@link IAutoMovieMesh} (no skinning). */
export const tessellateToMesh = (
  shape: AutoMoviePrimitiveShape,
): IAutoMovieMesh => {
  const t = tessellate(shape);
  return {
    positions: t.positions,
    normals: t.normals,
    uvs: null,
    indices: t.indices,
    skin: null,
  };
};
