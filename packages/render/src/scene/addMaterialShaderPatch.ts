import type * as THREE from "three";

import type { IMaterialShaderPatch } from "./IMaterialShaderPatch.js";
import { applyMaterialShaderPatches } from "./applyMaterialShaderPatches.js";
import { readMaterialShaderPatches } from "./readMaterialShaderPatches.js";

/**
 * Add a shader patch to a material, keeping the ones already on it: three calls
 * one `onBeforeCompile`, so every patch a material carries runs in the order it
 * was added and the program key names them all. A patch whose key the material
 * already carries replaces that one, so applying a patch again injects it
 * once.
 *
 * This owner installs the material's compile and program-key hooks; an
 * unrelated preexisting hook is not composed. Registered keys must avoid
 * ambiguous `+` concatenation, and registration should finish before first
 * compilation since this helper does not set needsUpdate for an
 * already-compiled material.
 */
export const addMaterialShaderPatch: (
  material: THREE.Material,
  patch: IMaterialShaderPatch,
) => void = (material: THREE.Material, patch: IMaterialShaderPatch): void => {
  const patches: IMaterialShaderPatch[] = [
    ...readMaterialShaderPatches(material).filter(
      (one: IMaterialShaderPatch): boolean => one.key !== patch.key,
    ),
    patch,
  ];
  material.userData.shaderPatches = patches;
  material.onBeforeCompile = (
    shader: THREE.WebGLProgramParametersWithUniforms,
  ): void => {
    applyMaterialShaderPatches(patches, shader);
  };
  material.customProgramCacheKey = (): string =>
    patches.map((one: IMaterialShaderPatch): string => one.key).join("+");
};
