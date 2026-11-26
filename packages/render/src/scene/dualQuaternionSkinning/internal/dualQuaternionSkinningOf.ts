import type * as THREE from "three";

/**
 * Whether `buildModel` bound this mesh with a dual-quaternion skin, so a pass
 * that swaps its material must patch the replacement the same way or draw the
 * skin linearly blended. The flag is an internal typed handoff from the
 * builder; a foreign userData value is not admitted by this lookup.
 */
export const dualQuaternionSkinningOf: (object: THREE.Object3D) => boolean = (
  object: THREE.Object3D,
): boolean => object.userData.automovieDualQuaternionSkinning === true;
