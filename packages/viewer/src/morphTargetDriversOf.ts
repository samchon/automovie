import type { IAutoMovieMeshMorphTarget } from "@automovie/interface";
import type * as THREE from "three";

/**
 * Read the pose-driven morph targets `buildModel` recorded on a mesh, or null
 * when it has none. The record is an internal typed handoff from the builder to
 * `applyPose`; arbitrary foreign userData values are not admitted by this
 * lookup.
 *
 * @evidence contracts/common.md#principled-implementation Reads the exact automovieMorphTargetDrivers array buildModel installs, holding only targets with a driver, and maps absence to null; a foreign malformed value is not runtime-validated by the cast.
 * @evidence contracts/common.md#clear-and-simple-design One metadata lookup lets applyPose find driven targets on the built mesh itself, the same pattern formationCycleOf uses, without widening the built-model handle.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the builder's structural key and actual target records, with no mesh-name matching or synthesized driver.
 * @evidence contracts/common.md#meaningful-documentation States the writer, the reader, the null meaning and the trusted-handoff premise.
 * @evidence contracts/performance.md#efficient-algorithms One property read in constant time with no allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Returns the builder's array by reference rather than copying it per pose.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows the mesh and array and retains neither; the mesh's owner releases both with the mesh.
 */
export const morphTargetDriversOf: (
  object: THREE.Object3D,
) => readonly IAutoMovieMeshMorphTarget[] | null = (
  object: THREE.Object3D,
): readonly IAutoMovieMeshMorphTarget[] | null =>
  (object.userData.automovieMorphTargetDrivers as
    | readonly IAutoMovieMeshMorphTarget[]
    | undefined) ?? null;
