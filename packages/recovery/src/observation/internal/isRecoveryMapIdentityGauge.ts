import type { IAutoMovieRecoveryMapPose } from "@automovie/interface";

/*
 * Check the original exact first-pose identity gauge with indexed coefficients.
 */
export function isRecoveryMapIdentityGauge(
  pose: IAutoMovieRecoveryMapPose,
): boolean {
  return (
    pose.rotation.length === 9 &&
    pose.translation.length === 3 &&
    pose.rotation[0] === 1 &&
    pose.rotation[1] === 0 &&
    pose.rotation[2] === 0 &&
    pose.rotation[3] === 0 &&
    pose.rotation[4] === 1 &&
    pose.rotation[5] === 0 &&
    pose.rotation[6] === 0 &&
    pose.rotation[7] === 0 &&
    pose.rotation[8] === 1 &&
    pose.translation[0] === 0 &&
    pose.translation[1] === 0 &&
    pose.translation[2] === 0
  );
}
