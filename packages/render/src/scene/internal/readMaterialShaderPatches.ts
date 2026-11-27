import type * as THREE from "three";

import type { IAutoMovieRenderMaterialShaderPatch } from "../IAutoMovieRenderMaterialShaderPatch.js";

/*
 * The shader patches `AutoMovieRenderMaterial.addShaderPatch` has put on a material, in the
 * order they run, or none.
 *
 * A caller can run them on a bare shader source through
 * `AutoMovieRenderMaterial.applyShaderPatches` to read the program a material will compile.
 */
export function readMaterialShaderPatches(
  material: THREE.Material,
): readonly IAutoMovieRenderMaterialShaderPatch[] {
  const patches: readonly IAutoMovieRenderMaterialShaderPatch[] | undefined =
    material.userData.shaderPatches;
  return patches ?? [];
}
