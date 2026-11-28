import type { IAutoMovieRecoveryRelativePoseStepOperation } from "@automovie/interface";

import { rotateRecoveryCameraFrame } from "./rotateRecoveryCameraFrame";

/*
 * Apply a five-coordinate local step while retaining a rotation and unit t. The
 * first three coordinates are a left rotation vector in radians; the final two
 * are coordinates in the supplied current translation tangent basis.
 */
export function stepRecoveryRelativePose(
  pose: Parameters<IAutoMovieRecoveryRelativePoseStepOperation.Operation>[0],
  tangent: Parameters<IAutoMovieRecoveryRelativePoseStepOperation.Operation>[1],
  step: Parameters<IAutoMovieRecoveryRelativePoseStepOperation.Operation>[2],
): ReturnType<IAutoMovieRecoveryRelativePoseStepOperation.Operation> {
  if (step.length !== 5 || tangent.length !== 2)
    throw new Error("camera-refinement: finite five-coordinate step required");
  const rotation: number[] = rotateRecoveryCameraFrame(pose.rotation, step);
  const direction: number[] = pose.translation.map(
    (value: number, at: number): number =>
      value + tangent[0]![at]! * step[3]! + tangent[1]![at]! * step[4]!,
  );
  const norm: number = Math.hypot(...direction);
  if (!(norm > 0))
    throw new Error("camera-refinement: nonrepresentable pose update");
  return {
    rotation,
    translation: [
      direction[0]! / norm,
      direction[1]! / norm,
      direction[2]! / norm,
    ],
  };
}
