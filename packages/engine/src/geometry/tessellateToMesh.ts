import { AutoMoviePrimitiveShape, IAutoMovieMesh } from "@automovie/interface";
import { tessellate } from "./tessellate";

/**
 * Tessellate, then wrap as a full {@link IAutoMovieMesh} (no skinning).
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-primitive-freeform-geometry Produces the repository's native mesh representation from a primitive.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Maps named geometry inputs into complete mesh buffers.
 */
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
