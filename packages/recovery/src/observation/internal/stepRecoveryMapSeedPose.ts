import type { IAutoMovieRecoveryMapPose } from "@automovie/interface";

import { stepRecoveryRelativePose } from "./stepRecoveryRelativePose";

/*
 * Apply the map seed's left rotation and current-radius sphere chart. Its raw
 * translation coefficients define r*normalize(t+Bz), with r=norm(t) held
 * constant at this base. Initial poses and points are not rescaled.
 */
export function stepRecoveryMapSeedPose(
  pose: IAutoMovieRecoveryMapPose,
  tangent: readonly (readonly [number, number, number])[],
  step: readonly number[],
): IAutoMovieRecoveryMapPose {
  const radius: number = Math.hypot(...pose.translation);
  if (Math.abs(radius - 1) > 1e-10)
    throw new Error("camera-map: unit seed translation required");
  const result: IAutoMovieRecoveryMapPose = stepRecoveryRelativePose(
    pose,
    tangent,
    step,
  );
  for (let axis: number = 0; axis < 3; axis++) {
    result.translation[axis] =
      pose.translation[axis]! +
      radius * (result.translation[axis]! - pose.translation[axis]! / radius);
  }
  return result;
}
