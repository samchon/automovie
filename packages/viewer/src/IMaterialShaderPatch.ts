import type * as THREE from "three";

/**
 * One named change to a material's compiled shader. Three supplies the native
 * program configuration to each operation, including fields an external
 * material patch may need beyond shader source and uniforms.
 *
 * @evidence requirements/rendering/materials-lighting-and-color.md#rendering-material-resolution Names one ordered material shading operation and its shader inputs.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-material-color Preserves the native program passed through the material compile hook.
 * @author Samchon
 */
export interface IMaterialShaderPatch {
  /** Part of the cache key that distinguishes patched and plain programs. */
  key: string;

  /**
   * Edits the caller's complete native program in registration order. A thrown
   * error stops subsequent operations without rolling back prior edits.
   */
  apply: (shader: THREE.WebGLProgramParametersWithUniforms) => void;
}
