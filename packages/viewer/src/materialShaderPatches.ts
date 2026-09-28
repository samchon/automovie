import type * as THREE from "three";

/** One named change to a material's compiled shader. */
export interface IMaterialShaderPatch {
  /** Part of the program key, so patched and plain materials never share a program. */
  key: string;
  /** Edits the shader source and uniforms before three compiles it. */
  apply: (shader: THREE.WebGLProgramParametersWithUniforms) => void;
}

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
    for (const one of patches) one.apply(shader);
  };
  material.customProgramCacheKey = () =>
    patches.map((one) => one.key).join("+");
};
