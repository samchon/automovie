import type * as THREE from "three";

/**
 * One named change to a material's compiled shader. Three supplies the native
 * program configuration to each operation, including fields an external
 * material patch may need beyond shader source and uniforms.
 *
 * @evidence contracts/development/design.md#principled-representation Pairs one structural program-cache identity with an operation on Three's complete program parameters/uniforms; the key must distinguish source structure, while mutable uniform values can share a compiled program without being encoded as new structure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A key plus mutation callback is the registration unit consumed by the ordered composer, avoiding a second restricted shader projection that would discard native fields.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Patch operations use the native compile extension point and complete input; key collisions or ambiguous key concatenation remain caller/composer limitations rather than assumed fixture equivalence.
 * @evidence contracts/development/common.md#meaningful-documentation Explains cache identity, registration order, full native input and nontransactional failure effects.
 */
export interface IMaterialShaderPatch {
  /** Part of the cache key that distinguishes patched and plain programs. */
  key: string;

  /**
   * Edits the caller's complete native program in registration order. A thrown
   * error stops subsequent operations without rolling back prior edits.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Operates on the same complete native shader object passed through ordered composition; caller-specific edits must preserve Three's compilation contract and previous operations' fields.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Keeps each source/uniform edit with its registered patch, leaving operation sequencing to applyMaterialShaderPatches.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts This supported compile hook is not replacement of a foreign implementation; each operation must avoid fixture answers and silent repair, which composition does not audit.
   * @evidence contracts/development/common.md#meaningful-documentation States in-place complete-input mutation, registration order and failure without rollback.
   * @evidence contracts/development/implementation.md#efficient-algorithms Work is patch-specific source/uniform editing; this callback contract promises neither constant cost nor a bound on externally supplied operations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Executes once per actual compile invocation with that shader rather than reusing prior mutable edits; the material program key controls compiled-program reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows the shader object for compilation; any captured texture/state is governed by its patch/material owner, with no independent release protocol in this callback.
   */
  apply: (shader: THREE.WebGLProgramParametersWithUniforms) => void;
}
