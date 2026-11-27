import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieRecoveryMapPose,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Apply an independent left SO3 and additive translation resection step.
 */
export function stepRecoveryMapPose(
  pose: IAutoMovieRecoveryMapPose,
  step: readonly number[],
): IAutoMovieRecoveryMapPose {
  if (step.length !== 6)
    throw new Error("camera-map: finite six-coordinate update required");
  const angle: number = Math.hypot(step[0]!, step[1]!, step[2]!);
  const increment: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
    { x: step[0]!, y: step[1]!, z: step[2]! },
    (angle * 180) / Math.PI,
  );
  const rotation: number[] = new Array<number>(9);
  for (let column: number = 0; column < 3; column++) {
    const value: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(increment, {
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
  return { rotation, translation };
}
