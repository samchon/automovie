import type * as THREE from "three";

import type { IAutoMovieSemanticMaskBinding } from "./IAutoMovieSemanticMaskBinding.js";
import { SCENE_MASK_KEY } from "./SCENE_MASK_KEY.js";

/**
 * The palette a scene was given, or `null` when it was given none.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Reads the actual scene userData binding under the shared semantic key and returns null when absent for packaged mask fallback selection.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One small scene-local read pairs with attachAutoMovieSemanticMask, avoiding a second global scene registry.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The cast relies on the maintained attach producer and does not validate arbitrary external userData; a returned binding cannot certify scene membership or pixels.
 * @evidence contracts/development/common.md#meaningful-documentation Documents absent null meaning and supplied palette lookup without inventing an admission or coverage verdict.
 * @evidence contracts/development/implementation.md#efficient-algorithms One property read/nullish branch is fixed work with no traversal or clone.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The current scene reference is read every time so binding replacement is observed; no stale memo survives scene userData mutation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned binding is borrowed from the scene and no additional retained state, material or native handle is acquired.
 */
export const autoMovieSemanticMaskOf: (
  scene: THREE.Scene,
) => IAutoMovieSemanticMaskBinding | null = (
  scene: THREE.Scene,
): IAutoMovieSemanticMaskBinding | null =>
  (scene.userData[SCENE_MASK_KEY] as
    | IAutoMovieSemanticMaskBinding
    | undefined) ?? null;
