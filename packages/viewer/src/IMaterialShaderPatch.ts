import type * as THREE from "three";

/**
 * One named change to a material's compiled shader. Three supplies the native
 * program configuration to each operation, including fields an external
 * material patch may need beyond shader source and uniforms.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Pairs one structural program-cache identity with an operation on Three's complete program parameters/uniforms; the key must distinguish source structure, while mutable uniform values can share a compiled program without being encoded as new structure.
 * @evidence contracts/common.md#clear-and-simple-design A key plus mutation callback is the registration unit consumed by the ordered composer, avoiding a second restricted shader projection that would discard native fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Patch operations use the native compile extension point and complete input; key collisions or ambiguous key concatenation remain caller/composer limitations rather than assumed fixture equivalence.
 * @evidence contracts/common.md#meaningful-documentation Explains cache identity, registration order, full native input and nontransactional failure effects.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The patch record chooses no shader traversal or compilation strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Registration/compiler owners use key identity to reuse programs; a patch record coordinates no compile request itself.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Material ownership determines patch closure lifetime; the shape acquires no program, renderer or task.
 */
export interface IMaterialShaderPatch {
  /** Part of the cache key that distinguishes patched and plain programs. */
  key: string;

  /**
   * Edits the caller's complete native program in registration order. A thrown
   * error stops subsequent operations without rolling back prior edits.
   *
   * @evidence contracts/common.md#principled-implementation Operates on the same complete native shader object passed through ordered composition; caller-specific edits must preserve Three's compilation contract and previous operations' fields.
   * @evidence contracts/common.md#clear-and-simple-design Keeps each source/uniform edit with its registered patch, leaving operation sequencing to applyMaterialShaderPatches.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts This supported compile hook is not replacement of a foreign implementation; each operation must avoid fixture answers and silent repair, which composition does not audit.
   * @evidence contracts/common.md#meaningful-documentation States in-place complete-input mutation, registration order and failure without rollback.
   * @evidence contracts/performance.md#efficient-algorithms Work is patch-specific source/uniform editing; this callback contract promises neither constant cost nor a bound on externally supplied operations.
   * @evidence contracts/performance.md#reuse-equivalent-work Executes once per actual compile invocation with that shader rather than reusing prior mutable edits; the material program key controls compiled-program reuse.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows the shader object for compilation; any captured texture/state is governed by its patch/material owner, with no independent release protocol in this callback.
   */
  apply: (shader: THREE.WebGLProgramParametersWithUniforms) => void;
}
