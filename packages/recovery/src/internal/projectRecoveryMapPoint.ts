import { AutoMovieMatrix3 } from "@automovie/engine/math/AutoMovieMatrix3";

import type { IAutoMovieRecoveryMapPose } from "../structures/image/IAutoMovieRecoveryMapPose";

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
 * @evidence contracts/performance.md#reuse-equivalent-work Rotated coordinates and reciprocal depth serve both pixel coordinates and all derivatives in the same call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned fixed-size derivative rows transfer to the caller; no point array, image, cache or external handle remains.
 */
export function projectRecoveryMapPoint(
  pose: IAutoMovieRecoveryMapPose,
  point: readonly [number, number, number],
  intrinsic: readonly number[],
): {
  pixel: [number, number];
  depth: number;
  cameraJacobian: number[][];
  pointJacobian: number[][];
} | null {
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
  const cameraJacobian: number[][] = chart.map((row: number[]): number[] => [
    ...[0, 1, 2].map(
      (column: number): number =>
        -row.reduce(
          (sum: number, value: number, at: number): number =>
            sum + value * skew[3 * at + column]!,
          0,
        ),
    ),
    ...row,
  ]);
  const pointJacobian: number[][] = chart.map((row: number[]): number[] =>
    [0, 1, 2].map((column: number): number =>
      row.reduce(
        (sum: number, value: number, at: number): number =>
          sum + value * pose.rotation[3 * at + column]!,
        0,
      ),
    ),
  );
  if (
    ![...pixel, ...cameraJacobian.flat(), ...pointJacobian.flat()].every(
      Number.isFinite,
    )
  )
    throw new Error("camera-map: nonrepresentable projection derivative");
  return { pixel, depth: q[2]!, cameraJacobian, pointJacobian };
}
