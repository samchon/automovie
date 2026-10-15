import type * as THREE from "three";

import { addMaterialShaderPatch } from "../addMaterialShaderPatch.js";
import { createDualQuaternionSkinningShaderPatch } from "./createDualQuaternionSkinningShaderPatch.js";

/**
 * Make a material draw skinned meshes with dual quaternion skinning instead of
 * Three's linear blend. A mesh drawn without skinning compiles the patch away,
 * because every replacement sits under `USE_SKINNING`. Register it before the
 * material first compiles; the composer sets no `needsUpdate`.
 *
 * @evidence contracts/common.md#principled-implementation Registers the dual quaternion vertex patch through the shared ordered compile hook, so it composes with relief and detail patches and enters the program key.
 * @evidence contracts/common.md#clear-and-simple-design A one-line owner gives buildModel a named step, while the descriptor and GLSL stay in their own files.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the existing patch mechanism rather than replacing SkinnedMesh or Three's chunks globally, so plain materials keep linear skinning.
 * @evidence contracts/common.md#meaningful-documentation States the effect, the no-skinning behaviour and the register-before-compile premise.
 * @evidence contracts/performance.md#efficient-algorithms Adds one descriptor; compile-time cost is the vertex transformation's string work.
 * @evidence contracts/performance.md#reuse-equivalent-work The stable key lets equivalent materials reuse one compiled program.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The material retains the descriptor until its owner disposes it; no GPU resource is acquired here.
 */
export const applyDualQuaternionSkinning: (material: THREE.Material) => void = (
  material: THREE.Material,
): void => {
  addMaterialShaderPatch(material, createDualQuaternionSkinningShaderPatch());
};
