import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieRecoveryRelativePoseStepOperation,
  IAutoMovieVector3,
} from "@automovie/interface";

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
  const angle: number = Math.hypot(step[0]!, step[1]!, step[2]!);
  const quaternion: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
    { x: step[0]!, y: step[1]!, z: step[2]! },
    (angle * 180) / Math.PI,
  );
  const rotation: number[] = new Array<number>(9);
  for (let column: number = 0; column < 3; column++) {
    const value: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(quaternion, {
      x: pose.rotation[column]!,
      y: pose.rotation[3 + column]!,
      z: pose.rotation[6 + column]!,
    });
    rotation[column] = value.x;
    rotation[3 + column] = value.y;
    rotation[6 + column] = value.z;
  }
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
