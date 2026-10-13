import type * as THREE from "three";

import { reliefWeightFragment } from "./reliefWeightFragment.js";
import { reliefWeightVertex } from "./reliefWeightVertex.js";

/**
 * One relief-weight operation for the material compile hook. The callback
 * changes only the vertex and fragment source; uniforms and the native program
 * configuration remain with the caller and other registered operations.
 */
export const createReliefWeightShaderPatch = (): {
  /** Stable program-cache contribution for this operation. */
  key: string;

  /** Adds relief interpolation and base-normal modulation to shader source. */
  apply: (
    shader: Pick<
      THREE.WebGLProgramParametersWithUniforms,
      "vertexShader" | "fragmentShader" | "uniforms"
    >,
  ) => void;
} => ({
  key: "automovie-relief-weights",
  apply: (shader) => {
    shader.vertexShader = reliefWeightVertex(shader.vertexShader);
    shader.fragmentShader = reliefWeightFragment(shader.fragmentShader);
  },
});
