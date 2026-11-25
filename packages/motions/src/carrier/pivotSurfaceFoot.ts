import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Rotate a shoe or ski around a foot-local support, keeping that point fixed.
 *
 * @param goal The goal with the world orientation of the entered foot.
 * @param contact The support relative to the foot joint, metres.
 * @param axis A rotation axis in that frame.
 * @param degrees The signed rotation angle.
 * @returns The adjusted ankle target, knee bend reference and orientation.
 */
export function pivotSurfaceFoot(
  goal: IAutoMovieHumanLimbGoal,
  contact: IAutoMovieVector3,
  axis: IAutoMovieVector3,
  degrees: number,
): IAutoMovieHumanLimbGoal {
  const before: IAutoMovieQuaternion = goal.rotation!;
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    before,
    Quaternion.fromAxisAngle(axis, degrees),
  );
  const correction: IAutoMovieVector3 = Vector3.subtract(
    Quaternion.rotateVector(before, contact),
    Quaternion.rotateVector(rotation, contact),
  );
  return {
    ...goal,
    point: Vector3.add(goal.point, correction),
    bend: Vector3.add(goal.bend, correction),
    rotation,
    contact,
  };
}
