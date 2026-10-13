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
