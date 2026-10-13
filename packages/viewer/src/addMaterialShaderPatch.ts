import type * as THREE from "three";

import type { IMaterialShaderPatch } from "./IMaterialShaderPatch.js";
import { applyMaterialShaderPatches } from "./applyMaterialShaderPatches.js";

/**
 * Add a shader patch to a material, keeping the ones already on it: three
 * calls one `onBeforeCompile`, so every patch a material carries runs in the
 * order it was added and the program key names them all.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Composes the declared material's render-time shading changes into one program.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Implements the ordered composition of material shading at the render boundary.
 */
export const addMaterialShaderPatch = (
  material: THREE.Material,
  patch: IMaterialShaderPatch,
): void => {
  const patches: IMaterialShaderPatch[] = [
    ...((material.userData.shaderPatches as
      | IMaterialShaderPatch[]
      | undefined) ?? []),
    patch,
  ];
  material.userData.shaderPatches = patches;
  material.onBeforeCompile = (shader) => {
    applyMaterialShaderPatches(patches, shader);
  };
  material.customProgramCacheKey = () =>
    patches.map((one) => one.key).join("+");
};
