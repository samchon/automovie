import type * as THREE from "three";
import { applyDualQuaternionSkinning as applyDualQuaternionSkinningImplementation } from "./dualQuaternionSkinning/internal/applyDualQuaternionSkinning.js";
import { type IAutoMovieRenderMaterialShaderPatch } from "./IAutoMovieRenderMaterialShaderPatch.js";
import { createDualQuaternionSkinningShaderPatch as createDualQuaternionSkinningShaderPatchImplementation } from "./dualQuaternionSkinning/internal/createDualQuaternionSkinningShaderPatch.js";
import { dualQuaternionSkinningOf as dualQuaternionSkinningOfImplementation } from "./dualQuaternionSkinning/internal/dualQuaternionSkinningOf.js";
import { dualQuaternionSkinningVertex as dualQuaternionSkinningVertexImplementation } from "./dualQuaternionSkinning/internal/dualQuaternionSkinningVertex.js";

/** Public operations for Auto Movie Render Dual Quaternion Skinning. */
export namespace AutoMovieRenderDualQuaternionSkinning {
  /**
   * Make a material draw skinned meshes with dual quaternion skinning instead of
   * Three's linear blend. A mesh drawn without skinning compiles the patch away,
   * because every replacement sits under `USE_SKINNING`. Register it before the
   * material first compiles; the composer sets no `needsUpdate`.
   */
  export function apply(material: THREE.Material): void {
    applyDualQuaternionSkinningImplementation(material);
  }

  /**
   * One dual quaternion skinning operation for the material compile hook. It
   * rewrites the vertex source only; uniforms, fragment source and the native
   * program configuration stay with the caller and the other registered patches.
   */
  export function createShaderPatch(): IAutoMovieRenderMaterialShaderPatch {
    return createDualQuaternionSkinningShaderPatchImplementation();
  }

  /**
   * Whether `buildModel` bound this mesh with a dual-quaternion skin, so a pass
   * that swaps its material must patch the replacement the same way or draw the
   * skin linearly blended. The flag is an internal typed handoff from the
   * builder; a foreign userData value is not admitted by this lookup.
   */
  export function of(object: THREE.Object3D): boolean {
    return dualQuaternionSkinningOfImplementation(object);
  }

  /**
   * Replace a vertex shader's linear blend skinning with dual quaternion
   * skinning, the formula `skinAutoMovieMesh` evaluates in the engine.
   *
   * Three's bone matrix for joint `j` is `G P_j R_j^-1`, with `G` the model's
   * world placement at draw time, and its attached bind gives `bindMatrixInverse
   * = (G T)^-1` for the part transform `T`. The shader therefore blends `K_j =
   * bindMatrixInverse * boneMatrix_j * bindMatrix = T^-1 P_j R_j^-1 T`, which
   * cancels `G` and stays rigid for a rigid or uniformly scaled `T`. Each `K_j`
   * becomes a unit dual quaternion through Shepperd's matrix-to-quaternion
   * method; the four are aligned to the hemisphere of the largest weight (the
   * lowest slot on a tie), summed by weight, divided by the length of the
   * rotation part and applied to the morphed position. Normals and tangents turn
   * by the blended rotation alone. The result is already in the part's frame, so
   * no `bindMatrixInverse` follows.
   *
   * The blend is computed once after `skinbase_vertex` and read by the normal and
   * position chunks, so depth and distance shaders, which skip the normal chunk,
   * still skin their positions. A shader missing the skinning parameter, base or
   * position chunk is refused rather than left on linear skinning.
   */
  export function vertex(vertexShader: string): string {
    return dualQuaternionSkinningVertexImplementation(vertexShader);
  }
}
