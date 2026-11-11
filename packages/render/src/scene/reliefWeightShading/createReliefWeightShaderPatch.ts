import type * as THREE from "three";

import { reliefWeightFragment } from "./reliefWeightFragment.js";
import { reliefWeightVertex } from "./reliefWeightVertex.js";

/**
 * One relief-weight operation for the material compile hook. The callback changes only the vertex and fragment source; uniforms and the native program configuration remain with the caller and other registered operations.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Creates the unchanged relief-weight compile operation and stable key, applying only the existing vertex/fragment source transformations to the supplied shader.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One descriptor fits the common material patch protocol, keeping uniform and native program configuration with the material/compiler owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No renderer callback or foreign method is replaced; required shader markers and relief attribute remain premises and the descriptor does not certify compiled pixels.
 * @evidence contracts/development/common.md#meaningful-documentation Documents stable cache contribution and source-only mutation without taking uniform/native configuration ownership.
 * @evidence contracts/development/implementation.md#efficient-algorithms Descriptor creation is fixed allocation and apply delegates a fixed set of linear shader-string transformations; no mesh/pixel traversal is introduced.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Equal operation structure uses one stable program-key contribution while the material patch chain retains ordering; a descriptor does not memoize arbitrary shader text.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned callback retains only module function references and acquires no shader/program/texture; material compile-hook ownership bounds its retention.
 */
export const createReliefWeightShaderPatch: () => {
  /** Stable program-cache contribution for this operation. */
  key: string;

  /** Adds relief interpolation and base-normal modulation to shader source. */
  apply: (
    shader: Pick<
      THREE.WebGLProgramParametersWithUniforms,
      "vertexShader" | "fragmentShader" | "uniforms"
    >,
  ) => void;
} = (): {
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
  apply: (
    shader: Pick<
      THREE.WebGLProgramParametersWithUniforms,
      "vertexShader" | "fragmentShader" | "uniforms"
    >,
  ): void => {
    shader.vertexShader = reliefWeightVertex(shader.vertexShader);
    shader.fragmentShader = reliefWeightFragment(shader.fragmentShader);
  },
});
