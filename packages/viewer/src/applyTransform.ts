import type { IAutoMovieTransform } from "@automovie/interface";
import type * as THREE from "three";

/**
 * Copy an admitted local TRS to a borrowed Three object: metre translation,
 * engine x/y/z/w quaternion and dimensionless scale. The host updates world
 * matrices when needed; this adapter does not normalize or repair source data.
 *
 * @evidence contracts/common.md#principled-implementation Uses Three's position/quaternion/scale setters in engine component order, preserving local TRS; finite components and a valid normalized authored quaternion are admission premises, with no implicit world-space reparenting.
 * @evidence contracts/common.md#clear-and-simple-design Owns the single portable-to-Three field conversion shared by scene, light and pose writers, while those owners choose their coordinate-frame inputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Copies admitted values without object-name cases, unit guesses, quaternion repair or foreign method substitution.
 * @evidence contracts/common.md#meaningful-documentation Gives local frame, metre/quaternion/scale conventions and separates field copy from world-matrix propagation.
 * @evidence contracts/performance.md#efficient-algorithms Writes ten fixed scalar components through three setters in constant time/space independent of descendants or vertex count.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses existing target vector/quaternion cells and the common conversion; mutable target values are overwritten each call rather than skipped from a stale source-only comparison.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows object/transform for the call and retains neither; owns no geometry/material/renderer or task and leaves field state with the host object.
 */
export const applyTransform: (obj: THREE.Object3D, t: IAutoMovieTransform) => void = (
  obj: THREE.Object3D,
  t: IAutoMovieTransform,
): void => {
  obj.position.set(t.translation.x, t.translation.y, t.translation.z);
  obj.quaternion.set(t.rotation.x, t.rotation.y, t.rotation.z, t.rotation.w);
  obj.scale.set(t.scale.x, t.scale.y, t.scale.z);
};
