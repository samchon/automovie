import type * as THREE from "three";

import { reliefWeightFragment } from "./reliefWeightFragment.js";
import { reliefWeightVertex } from "./reliefWeightVertex.js";

/**
 * One relief-weight operation for the material compile hook. The callback
 * changes only the vertex and fragment source; uniforms and the native program
 * configuration remain with the caller and other registered operations.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Builds the operation that applies the mesh's relief weights to material shading.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Interpolates relief weights and applies them at the base-normal scale boundary.
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
