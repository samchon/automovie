import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Apply the same left SO(3) increment to each row-major rotation column. The
 * angular increment is in radians and the callers own translation.
 */
export function rotateRecoveryCameraFrame(
  frame: readonly number[],
  step: readonly number[],
): number[] {
  const angle: number = Math.hypot(step[0]!, step[1]!, step[2]!);
  const increment: IAutoMovieQuaternion =
    AutoMovieEngineQuaternion.fromAxisAngle(
      { x: step[0]!, y: step[1]!, z: step[2]! },
      (angle * 180) / Math.PI,
    );
  const rotation: number[] = new Array<number>(9);
  for (let column: number = 0; column < 3; column++) {
    const value: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      increment,
      { x: frame[column]!, y: frame[3 + column]!, z: frame[6 + column]! },
    );
    rotation[column] = value.x;
    rotation[3 + column] = value.y;
    rotation[6 + column] = value.z;
  }
  return rotation;
}
