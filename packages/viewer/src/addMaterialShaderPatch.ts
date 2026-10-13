import type * as THREE from "three";

import type { IMaterialShaderPatch } from "./IMaterialShaderPatch.js";
import { applyMaterialShaderPatches } from "./applyMaterialShaderPatches.js";

/**
 * Add a shader patch to a material, keeping the ones already on it: three
 * calls one `onBeforeCompile`, so every patch a material carries runs in the
 * order it was added and the program key names them all.
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
