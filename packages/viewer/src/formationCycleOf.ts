import type * as THREE from "three";

import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle.js";

/**
 * Read the cycle bound by the Viewer formation owner, or null when absent.
 * The metadata is an internal typed handoff; arbitrary foreign userData values
 * are not structurally admitted by this lookup.
 *
 * @evidence contracts/common.md#principled-implementation Reads the exact automovieFormationCycle reference installed by bindFormationTierCycle and maps omission to null; current callers pass native mesh owners, while foreign malformed metadata is not runtime-validated by the cast.
 * @evidence contracts/common.md#clear-and-simple-design One metadata lookup lets guide-pass overrides borrow the same actual tier cycle rather than rediscovering a repertoire or keying animation by object names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the supported structural metadata key and its actual reference, with no fixture mesh names, synthesized static cycle or replaced native userData getter.
 * @evidence contracts/common.md#meaningful-documentation States bound-cycle versus absent/null meaning and internal trusted-handoff premise rather than implying arbitrary userData is admitted.
 * @evidence contracts/performance.md#efficient-algorithms One property read/nullish branch costs constant time and allocates no result object or scene traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Returns the existing tier cycle identity, enabling actual uniform-equivalent material sharing; no duplicate bake or copied table is created.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows object/cycle and retains neither beyond the call; tier owner still controls cycle texture lifetime, and the lookup acquires no native resource/task.
 */
export const formationCycleOf: (object: THREE.Object3D) => IAutoMovieFormationCycle | null = (
  object: THREE.Object3D,
): IAutoMovieFormationCycle | null =>
  (object.userData.automovieFormationCycle as
    | IAutoMovieFormationCycle
    | undefined) ?? null;
