import type * as THREE from "three";
import { addMaterialShaderPatch } from "../addMaterialShaderPatch.js";
import { createDetailNormalShaderPatch } from "./createDetailNormalShaderPatch.js";

/**
 * Blend a second tangent-space normal map over a material's normal map: the
 * detail map is sampled over the first UV set through its own texture
 * transform, its slopes scaled by `scale`, and the two combined by whiteout
 * blending, `normalize(vec3(n1.xy + n2.xy, n1.z * n2.z))`, so a fine relief
 * tiled over a coarser one keeps both. The material must already carry a
 * tangent-space `normalMap`.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Resolves a material's detail normal map into the declared render material.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Implements the detail normal blend at the render boundary.
 */
export const applyDetailNormal = (
  material: THREE.MeshPhysicalMaterial,
  texture: THREE.Texture,
  scale: number,
): void => {
  const patch = createDetailNormalShaderPatch(texture, scale);
  material.userData.detailNormal = { texture, scale };
  addMaterialShaderPatch(material, patch);
};
