import { AutoMovieEngineMatrix3 } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryMapPose,
  IAutoMovieRecoveryMapProjection,
} from "@automovie/interface";

import { evaluateRecoveryMapProjectionChart } from "./evaluateRecoveryMapProjectionChart";
import { transformRecoveryMapPoint } from "./transformRecoveryMapPoint";

/*
 * Project a finite world point and differentiate the calibrated pixel chart.
 * Rotation increments act on R alone on the left, while t has an independent
 * additive camera-frame increment. Point derivatives are in world coordinates.
 * Nonpositive depth has no supported projection and returns null.
 */
export function projectRecoveryMapPoint(
  pose: IAutoMovieRecoveryMapPose,
  point: Readonly<AutoMovieVector3Tuple>,
  intrinsic: readonly number[],
): IAutoMovieRecoveryMapProjection | null {
  const { rotated, camera: q }: ReturnType<typeof transformRecoveryMapPoint> =
    transformRecoveryMapPoint(pose, point);
  if (!q.every(Number.isFinite))
    throw new Error("camera-map: nonrepresentable camera coordinates");
  if (!(q[2]! > 0)) return null;
  const {
    pixel,
    gradient,
  }: ReturnType<typeof evaluateRecoveryMapProjectionChart> =
    evaluateRecoveryMapProjectionChart(q, intrinsic);
  const skew: number[] = AutoMovieEngineMatrix3.skew(rotated);
  const cameraJacobian: number[][] = [],
    pointJacobian: number[][] = [];
  for (const row of gradient) {
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
    !pixel.every(Number.isFinite) ||
    cameraJacobian.some(
      (row: number[]): boolean => !row.every(Number.isFinite),
    ) ||
    pointJacobian.some((row: number[]): boolean => !row.every(Number.isFinite))
  )
    throw new Error("camera-map: nonrepresentable projection derivative");
  return { pixel, depth: q[2]!, cameraJacobian, pointJacobian };
}
