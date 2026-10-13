import type * as THREE from "three";

/**
 * One named change to a material's compiled shader. Three supplies the native
 * program configuration to each operation, including fields an external
 * material patch may need beyond shader source and uniforms.
 *
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
