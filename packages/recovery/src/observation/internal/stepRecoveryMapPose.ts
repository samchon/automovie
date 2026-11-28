import type { IAutoMovieRecoveryMapPose } from "@automovie/interface";

import { rotateRecoveryCameraFrame } from "./rotateRecoveryCameraFrame";

/*
 * Apply an independent left SO3 and additive translation resection step.
 */
export function stepRecoveryMapPose(
  pose: IAutoMovieRecoveryMapPose,
  step: readonly number[],
): IAutoMovieRecoveryMapPose {
  if (step.length !== 6)
    throw new Error("camera-map: finite six-coordinate update required");
  const rotation: number[] = rotateRecoveryCameraFrame(pose.rotation, step);
  const translation: [number, number, number] = [
    pose.translation[0] + step[3]!,
    pose.translation[1] + step[4]!,
    pose.translation[2] + step[5]!,
  ];
  return { rotation, translation };
}
