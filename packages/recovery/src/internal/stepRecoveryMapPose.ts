import { Quaternion } from "@automovie/engine/math/Quaternion";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";

/**
 * Apply an independent left SO3 and additive translation resection step.
 *
 * @evidence contracts/common.md#principled-implementation The rotation-vector exponential acts on each R column, while the final three local coordinates add to t in camera coordinates. This matches the pinhole derivative's six-coordinate chart.
 * @evidence contracts/common.md#clear-and-simple-design One update owner serves resection and the unrestricted third pose in joint fitting; the seed's unit-baseline update stays separate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No Euler clipping, affine rotation, independent unit-baseline normalization or previous-pose fallback conceals a failed step.
 * @evidence contracts/common.md#meaningful-documentation States radians, left composition, camera-frame translation and absence of a metric-scale inference.
 * @evidence contracts/performance.md#efficient-algorithms A quaternion construction, three column rotations and three additions require constant work and storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The same increment quaternion transforms every current rotation column.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a new fixed-size pose returns; no caller-owned array, cache or external handle persists.
 */
export function stepRecoveryMapPose(
  pose: IAutoMovieRecoveryMapPose,
  step: readonly number[],
): IAutoMovieRecoveryMapPose {
  if (step.length !== 6 || !step.every(Number.isFinite))
    throw new Error("camera-map: finite six-coordinate update required");
  const angle: number = Math.hypot(step[0]!, step[1]!, step[2]!);
  const increment: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: step[0]!, y: step[1]!, z: step[2]! },
    (angle * 180) / Math.PI,
  );
  const rotation: number[] = new Array<number>(9);
  for (let column: number = 0; column < 3; column++) {
    const value: IAutoMovieVector3 = Quaternion.rotateVector(increment, {
      x: pose.rotation[column]!,
      y: pose.rotation[3 + column]!,
      z: pose.rotation[6 + column]!,
    });
    rotation[column] = value.x;
    rotation[3 + column] = value.y;
    rotation[6 + column] = value.z;
  }
  const translation: [number, number, number] = [
    pose.translation[0] + step[3]!,
    pose.translation[1] + step[4]!,
    pose.translation[2] + step[5]!,
  ];
  if (![...rotation, ...translation].every(Number.isFinite))
    throw new Error("camera-map: nonrepresentable pose update");
  return { rotation, translation };
}
