import type * as THREE from "three";

/**
 * The part of a compiled program a material shader patch reads and edits: its
 * vertex and fragment source and its uniforms.
 *
 * Three hands each `onBeforeCompile` its complete program parameters, which
 * hold these fields, so a patch that takes only them accepts what three
 * supplies, and a caller may pass just the source it wants patched.
 */
export type IAutoMovieRenderMaterialShaderSource = Pick<
  THREE.WebGLProgramParametersWithUniforms,
  "vertexShader" | "fragmentShader" | "uniforms"
>;
