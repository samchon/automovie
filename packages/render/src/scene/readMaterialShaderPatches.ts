import type * as THREE from "three";

import type { IMaterialShaderPatch } from "./IMaterialShaderPatch.js";

/**
 * The shader patches `addMaterialShaderPatch` has put on a material, in the
 * order they run, or none.
 *
 * A caller can run them on a bare shader source through
 * `applyMaterialShaderPatches` to read the program a material will compile.
 */
export function readMaterialShaderPatches(
  material: THREE.Material,
): readonly IMaterialShaderPatch[] {
  const patches: readonly IMaterialShaderPatch[] | undefined =
    material.userData.shaderPatches;
  return patches ?? [];
}
