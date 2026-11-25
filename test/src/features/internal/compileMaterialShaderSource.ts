import {
  type IMaterialShaderSource,
  applyMaterialShaderPatches,
  readMaterialShaderPatches,
} from "@automovie/render";
import * as THREE from "three";

/**
 * The shader source a material will compile: the patches registered on it, run
 * in order on a copy of a base program, three's physical one by default.
 */
export function compileMaterialShaderSource(
  material: THREE.Material | readonly THREE.Material[],
  base: Pick<IMaterialShaderSource, "vertexShader" | "fragmentShader"> = THREE
    .ShaderLib.physical,
): IMaterialShaderSource {
  const shader: IMaterialShaderSource = {
    vertexShader: base.vertexShader,
    fragmentShader: base.fragmentShader,
    uniforms: {},
  };
  for (const one of [material].flat())
    applyMaterialShaderPatches(readMaterialShaderPatches(one), shader);
  return shader;
}
