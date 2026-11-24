import type {
  AutoMovieHumanoidBone,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { qunit } from "./qunit";

/**
 * Validate a displayed frame before a distance or maximum can hide NaN.
 *
 * @param bones The actual performance's displayed bones.
 * @param label The subject and film second, for a located failure.
 * @throws {Error} When the frame is empty, a coordinate is nonfinite, or a
 *   rotation is not unit within the shared quaternion predicate's 1e-6 bound.
 * @evidence contracts/development/common.md#meaningful-documentation States the accepted frame and the failure location.
 * @evidence contracts/development/implementation.md#principled-implementation Finite coordinates and unit quaternions are prerequisites of the distance and rotation measures; the existing qunit predicate owns the normalization bound.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the displayed bones, with a failure naming the bone and channel.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Checks the actual displayed values without changing a body, pose, or bound.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the displayed bone count and constant extra space.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A frame is checked once when its owning film first reads it.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no frame or body.
 */
export function motionHumanFrame(
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  label: string,
): void {
  if (bones.size === 0) throw new Error(`${label}: no displayed bones`);
  for (const [bone, shown] of bones) {
    for (const [channel, rotation] of [
      ["local", shown.localRotation],
      ["world", shown.worldRotation],
    ] as const)
      if (!qunit(rotation))
        throw new Error(
          `${label} ${bone}: a nonfinite or nonunit ${channel} rotation`,
        );
  }
}
