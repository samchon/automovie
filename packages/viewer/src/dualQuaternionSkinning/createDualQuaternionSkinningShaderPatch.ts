import type { IMaterialShaderPatch } from "../IMaterialShaderPatch.js";
import { dualQuaternionSkinningVertex } from "./dualQuaternionSkinningVertex.js";

/**
 * One dual quaternion skinning operation for the material compile hook. It
 * rewrites the vertex source only; uniforms, fragment source and the native
 * program configuration stay with the caller and the other registered patches.
 *
 * @evidence contracts/common.md#principled-implementation Pairs the stable key "automovie-dual-quaternion-skinning" with the vertex transformation that replaces Three's linear blend chunks, so a patched program never shares a cache entry with a plain one.
 * @evidence contracts/common.md#clear-and-simple-design One descriptor in the common material patch protocol, leaving the GLSL to the vertex transformation and registration to the material owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No renderer callback or Three method is replaced; a shader without the skinning chunks throws through the vertex transformation, and the descriptor certifies no pixels.
 * @evidence contracts/common.md#meaningful-documentation States the stable cache contribution and that only the vertex source changes.
 * @evidence contracts/performance.md#efficient-algorithms Constant allocation; apply delegates a fixed set of linear string replacements.
 * @evidence contracts/performance.md#reuse-equivalent-work The constant key lets every dual quaternion material with the same native features share one compiled program.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned callback retains only module functions; the material that registers it bounds its lifetime.
 */
export const createDualQuaternionSkinningShaderPatch: () => IMaterialShaderPatch =
  (): IMaterialShaderPatch => ({
    key: "automovie-dual-quaternion-skinning",
    apply: (shader: { vertexShader: string }): void => {
      shader.vertexShader = dualQuaternionSkinningVertex(shader.vertexShader);
    },
  });
