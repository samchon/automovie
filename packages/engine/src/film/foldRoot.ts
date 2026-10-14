import { IAutoMovieTransform } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { placeTransformedPoint } from "./placeTransformedPoint";

/**
 * Fold a sampled pose root into a node's staged placement, giving the world transform the viewer draws the actor's root at.
 *
 * The root is node-local: its translation is placed by the whole staged transform, scale then rotation then translation, and its rotation follows the staged rotation. Root scale is dropped, as Engine FK and the viewer drop it (#1052), so the result keeps the staged scale. A null root means the actor stands at its staged base, and `base` itself is returned.
 *
 * The rotation is exact when the staged scale is uniform, which staging gives every actor; under a non-uniform staged scale the drawn root basis is sheared, and the returned rotation and scale are its rotation-then-scale reading.
 *
 * @evidence contracts/common.md#principled-implementation The parent-child TRS composition `T_b + R_b(S_b · t_r)` for the position and `R_b ∘ R_r` for the orientation, in closed form with quaternions; the premise that root scale is identity is the rig convention the viewer's `applyPose` enforces, and the uniform-scale premise holds for every staged actor.
 * @evidence contracts/common.md#clear-and-simple-design One fold shared by beat snapshots, camera clearance, review reads, keypoint sidecars and grammar diagnostics, so each reads an actor's world root the same way; the position reuses `placeTransformedPoint`, the placement nodes' subject boxes use.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no actor; dropping root scale follows the shared rig convention rather than compensating for a caller, and the sheared non-uniform case is stated rather than hidden.
 * @evidence contracts/common.md#meaningful-documentation States the frame of the root, the order of the composition, why root scale is dropped, the null-root result, and when the rotation is exact.
 * @evidence contracts/performance.md#efficient-algorithms Constant time, one point placement and one quaternion product, with no matrix composed or decomposed.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of two transforms that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the result shares `base`'s scale object, or is `base` itself for a null root, so a caller must copy before mutating.
 */
export function foldRoot (
  base: IAutoMovieTransform,
  root: IAutoMovieTransform | null,
): IAutoMovieTransform {
  if (root === null) return base;
  return {
    translation: placeTransformedPoint(base, root.translation),
    rotation: Quaternion.multiply(base.rotation, root.rotation),
    scale: base.scale,
  };
}
