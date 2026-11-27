import { AutoMovieEngineMatrix3 } from "@automovie/engine";
import type { IAutoMovieRecoveryMapPointProjectionOperation } from "@automovie/interface";

/*
 * Project a finite world point and differentiate the calibrated pixel chart.
 * Rotation increments act on R alone on the left, while t has an independent
 * additive camera-frame increment. Point derivatives are in world coordinates.
 * Nonpositive depth has no supported projection and returns null.
 */
export function projectRecoveryMapPoint(
  pose: Parameters<IAutoMovieRecoveryMapPointProjectionOperation.Operation>[0],
  point: Parameters<IAutoMovieRecoveryMapPointProjectionOperation.Operation>[1],
  intrinsic: Parameters<IAutoMovieRecoveryMapPointProjectionOperation.Operation>[2],
): ReturnType<IAutoMovieRecoveryMapPointProjectionOperation.Operation> {
  const rotated: [number, number, number] = AutoMovieEngineMatrix3.apply(
    pose.rotation,
    point,
  );
  const q: number[] = rotated.map(
    (value: number, at: number): number => value + pose.translation[at]!,
  );
  if (q.some(overflowed))
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
  const skew: number[] = AutoMovieEngineMatrix3.skew(rotated);
  const cameraJacobian: number[][] = [],
    pointJacobian: number[][] = [];
  for (const row of chart) {
    const camera: number[] = new Array<number>(6),
      world: number[] = new Array<number>(3);
    for (let column: number = 0; column < 3; column++) {
      let cameraValue: number = 0,
        pointValue: number = 0;
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
  if (
    pixel.some(overflowed) ||
    cameraJacobian.some((row: number[]): boolean => row.some(overflowed)) ||
    pointJacobian.some((row: number[]): boolean => row.some(overflowed))
  )
    throw new Error("camera-map: nonrepresentable projection derivative");
  return { pixel, depth: q[2]!, cameraJacobian, pointJacobian };
}

/*
 * Whether a projected value overflowed binary64.
 */
function overflowed(value: number): boolean {
  return value === Infinity || value === -Infinity;
}
