import type * as THREE from "three";

/**
 * Whether `buildModel` bound this mesh with a dual-quaternion skin, so a pass
 * that swaps its material must patch the replacement the same way or draw the
 * skin linearly blended. The flag is an internal typed handoff from the
 * builder; a foreign userData value is not admitted by this lookup.
 *
 * @evidence contracts/common.md#principled-implementation Reads the exact automovieDualQuaternionSkinning flag buildModel sets on a dual-quaternion SkinnedMesh and treats anything else as linear, the interface default.
 * @evidence contracts/common.md#clear-and-simple-design One lookup lets every guide pass decide the patch the way formationCycleOf lets it decide the cycle, without inspecting shader patch lists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the builder's structural flag, not mesh names or material keys, so a pass cannot mistake a plain material for a skinning choice.
 * @evidence contracts/common.md#meaningful-documentation States the writer, why material-swapping passes need it and the trusted-handoff premise.
 * @evidence contracts/performance.md#efficient-algorithms One property read in constant time with no allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads the flag stored once at build instead of re-deriving it from the model per pass.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows the object and retains nothing.
 */
export const dualQuaternionSkinningOf: (object: THREE.Object3D) => boolean = (
  object: THREE.Object3D,
): boolean => object.userData.automovieDualQuaternionSkinning === true;
