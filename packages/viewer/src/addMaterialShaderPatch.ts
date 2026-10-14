import type * as THREE from "three";

import type { IMaterialShaderPatch } from "./IMaterialShaderPatch.js";
import { applyMaterialShaderPatches } from "./applyMaterialShaderPatches.js";

/**
 * Add a shader patch to a material, keeping the ones already on it: three
 * calls one `onBeforeCompile`, so every patch a material carries runs in the
 * order it was added and the program key names them all.
 *
 * This owner installs the material's compile and program-key hooks; an unrelated
 * preexisting hook is not composed. Registered keys must avoid ambiguous `+`
 * concatenation, and registration should finish before first compilation since
 * this helper does not set needsUpdate for an already-compiled material.
 *
 * @evidence contracts/common.md#principled-implementation Captures a new ordered registration array and installs Three's supported onBeforeCompile/customProgramCacheKey hooks; all native shader fields pass through to each patch, while patch keys must identify source structure and avoid joined-key collisions.
 * @evidence contracts/common.md#clear-and-simple-design One material userData list records composition and is also consumed by Human albedo observation; the private captured array preserves the registration order for that hook installation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the documented native compile extension points rather than mutating Three prototypes; unrelated preexisting hooks are overwritten, not secretly preserved, and no automatic recompilation compensation is applied to already-compiled materials.
 * @evidence contracts/common.md#meaningful-documentation Gives ordered composition, cache-key role, native-hook ownership and current preexisting-hook/key/recompilation limitations.
 * @evidence contracts/performance.md#efficient-algorithms Copies P registered patch references for each addition and joins P keys per cache-key query; compiling executes P operations plus their source-edit costs. Registering P patches individually has quadratic total list-copy work, acceptable only for the current few material features rather than an unbounded plugin population.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses prior registered operations and lets Three reuse programs by ordered joined structural keys; equivalent uniform values alone do not justify sharing effectful source edits, and callers own key correctness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Material userData and installed closures retain the patch list/captured patch state until material references are released; there is no unregister API or population cap, and this helper acquires no shader program or texture itself.
 */
export const addMaterialShaderPatch: (material: THREE.Material, patch: IMaterialShaderPatch) => void = (
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
  material.onBeforeCompile = (shader: THREE.WebGLProgramParametersWithUniforms): void => {
    applyMaterialShaderPatches(patches, shader);
  };
  material.customProgramCacheKey = (): string =>
    patches.map((one: IMaterialShaderPatch): string => one.key).join("+");
};
