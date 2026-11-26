import type * as THREE from "three";

import { addMaterialShaderPatch } from "../../addMaterialShaderPatch.js";
import { createDualQuaternionSkinningShaderPatch } from "./createDualQuaternionSkinningShaderPatch.js";

/**
 * Make a material draw skinned meshes with dual quaternion skinning instead of
 * Three's linear blend. A mesh drawn without skinning compiles the patch away,
 * because every replacement sits under `USE_SKINNING`. Register it before the
 * material first compiles; the composer sets no `needsUpdate`.
 */
export const applyDualQuaternionSkinning: (material: THREE.Material) => void = (
  material: THREE.Material,
): void => {
  addMaterialShaderPatch(material, createDualQuaternionSkinningShaderPatch());
};
