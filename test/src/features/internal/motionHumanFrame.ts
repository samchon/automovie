import type {
  AutoMovieHumanoidBone,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { qunit } from "./qunit";

/**
 * Check that a displayed frame has bones with finite positions and unit
 * rotations.
 *
 * @param bones Displayed bones with world positions and local and world
 *   rotations.
 * @param label Subject and film second to report on failure.
 * @throws If the frame is empty, a world coordinate is nonfinite, or either
 *   quaternion's Euclidean norm differs from one by more than 1e-6 or is
 *   nonfinite.
 * @evidence contracts/development/common.md#meaningful-documentation Names world coordinates and both checked rotation channels, the 1e-6 unit-norm tolerance and the subject, time and bone available in failures.
 * @evidence contracts/development/implementation.md#principled-implementation Rejects an empty displayed map and nonfinite XYZ before distances could hide invalid coordinates. It applies qunit to the actual local and world quaternion components. The predicate checks the finite Euclidean norm against one with its default 1e-6 tolerance.
 * @evidence contracts/development/implementation.md#efficient-algorithms Traverses each bone once and checks three coordinates and two fixed-size quaternion values. It keeps constant auxiliary space and retains no frame or body.
 */
export function motionHumanFrame(
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  label: string,
): void {
  if (bones.size === 0) throw new Error(`${label}: no displayed bones`);
  for (const [bone, shown] of bones) {
    const position = shown.worldPosition;
    for (const axis of ["x", "y", "z"] as const)
      if (!Number.isFinite(position[axis]))
        throw new Error(`${label} ${bone}: a nonfinite world position ${axis}`);
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
