import type { IMaterialShaderPatch } from "../../IMaterialShaderPatch.js";
import { dualQuaternionSkinningVertex } from "./dualQuaternionSkinningVertex.js";

/*
 * One dual quaternion skinning operation for the material compile hook. It
 * rewrites the vertex source only; uniforms, fragment source and the native
 * program configuration stay with the caller and the other registered patches.
 */
export const createDualQuaternionSkinningShaderPatch: () => IMaterialShaderPatch =
  (): IMaterialShaderPatch => ({
    key: "automovie-dual-quaternion-skinning",
    apply: (shader: { vertexShader: string }): void => {
      shader.vertexShader = dualQuaternionSkinningVertex(shader.vertexShader);
    },
  });
