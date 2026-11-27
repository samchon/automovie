import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Rotate a shoe or ski around a foot-local support, keeping that point fixed.
 * Parameter goal: The goal with the world orientation of the entered foot.
 * Parameter contact: The support relative to the foot joint, metres.
 * Parameter axis: A rotation axis in that frame.
 * Parameter degrees: The signed rotation angle.
 * Returns: The adjusted ankle target, knee bend reference and orientation.
 */
export function pivotSurfaceFoot(
  goal: IAutoMovieHumanLimbGoal,
  contact: IAutoMovieVector3,
  axis: IAutoMovieVector3,
  degrees: number,
): IAutoMovieHumanLimbGoal {
  const before: IAutoMovieQuaternion = goal.rotation!;
  const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
    before,
    AutoMovieEngineQuaternion.fromAxisAngle(axis, degrees),
  );
  const correction: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    AutoMovieEngineQuaternion.rotateVector(before, contact),
    AutoMovieEngineQuaternion.rotateVector(rotation, contact),
  );
  return {
    ...goal,
    point: AutoMovieEngineVector3.add(goal.point, correction),
    bend: AutoMovieEngineVector3.add(goal.bend, correction),
    rotation,
    contact,
  };
}
