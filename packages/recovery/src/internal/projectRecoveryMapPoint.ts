import { AutoMovieMatrix3 } from "@automovie/engine/math/AutoMovieMatrix3";

import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";
import type { IAutoMovieRecoveryMapProjection } from "../structures/internal/IAutoMovieRecoveryMapProjection";

/**
 * Project a finite world point and differentiate the calibrated pixel chart.
 * Rotation increments act on R alone on the left, while t has an independent
 * additive camera-frame increment. Point derivatives are in world coordinates.
 * Nonpositive depth has no supported projection and returns null.
 *
 * @evidence contracts/common.md#principled-implementation The pinhole quotient derivative includes focal anisotropy and skew. d(RX)/domega=-[RX]cross gives three SO3 columns, identity gives translation columns, and the world-point derivative is the chart derivative times R.
 * @evidence contracts/common.md#clear-and-simple-design This numerical owner supplies one projection and matching local derivatives to resection and joint refinement; robust weighting and acceptance stay with their coordinators.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No depth clamp, finite-difference derivative, expected camera or zero-residual replacement supplies a projection; nonrepresentable positive-depth arithmetic throws.
 * @evidence contracts/common.md#meaningful-documentation States transform/update conventions, derivative frames, positive-depth null and complete focal/skew pixel units.
 * @evidence contracts/performance.md#efficient-algorithms One point needs constant-size matrix actions and two six/three-column derivative rows, independent of image resolution.
 * @evidence contracts/performance.md#reuse-equivalent-work Rotated coordinates and depth serve pixels and all derivatives. Fixed loops fill only final derivative rows, preserving each zero-seeded three-term sum and its order without map/reduce or flattened validation arrays.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned fixed-size derivative rows transfer to the caller; no point array, image, cache or external handle remains.
 */
export function projectRecoveryMapPoint(
  pose: IAutoMovieRecoveryMapPose,
  point: readonly [number, number, number],
  intrinsic: readonly number[],
): IAutoMovieRecoveryMapProjection | null {
  const rotated: [number, number, number] = AutoMovieMatrix3.apply(
    pose.rotation,
    point,
  );
  const q: number[] = rotated.map(
    (value: number, at: number): number => value + pose.translation[at]!,
  );
  if (!q.every(Number.isFinite))
    throw new Error("camera-map: nonrepresentable camera coordinates");
  if (!(q[2]! > 0)) return null;
  const x: number = q[0]! / q[2]!,
    y: number = q[1]! / q[2]!;
  const pixel: [number, number] = [
    intrinsic[0]! * x + intrinsic[1]! * y + intrinsic[2]!,
    intrinsic[4]! * y + intrinsic[5]!,
  ];
  const chart: number[][] = [
    [
      intrinsic[0]! / q[2]!,
      intrinsic[1]! / q[2]!,
      -(intrinsic[0]! * x + intrinsic[1]! * y) / q[2]!,
    ],
    [0, intrinsic[4]! / q[2]!, (-intrinsic[4]! * y) / q[2]!],
  ];
  const skew: number[] = AutoMovieMatrix3.skew(rotated);
  const cameraJacobian: number[][] = [], pointJacobian: number[][] = [];
  for (const row of chart) {
    const camera: number[] = new Array<number>(6), world: number[] = new Array<number>(3);
    for (let column: number = 0; column < 3; column++) {
      let cameraValue: number = 0, pointValue: number = 0;
      for (let at: number = 0; at < 3; at++) {
        cameraValue += row[at]! * skew[3 * at + column]!;
        pointValue += row[at]! * pose.rotation[3 * at + column]!;
      }
      camera[column] = -cameraValue;
      camera[3 + column] = row[column]!;
      world[column] = pointValue;
    }
    cameraJacobian.push(camera);
    pointJacobian.push(world);
  }
  if (!pixel.every(Number.isFinite) || cameraJacobian.some(
    (row: number[]): boolean => !row.every(Number.isFinite),
  ) || pointJacobian.some((row: number[]): boolean => !row.every(Number.isFinite)))
    throw new Error("camera-map: nonrepresentable projection derivative");
  return { pixel, depth: q[2]!, cameraJacobian, pointJacobian };
}
