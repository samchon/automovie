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
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the initial frame, local units and retained point.
 * @evidence contracts/development/implementation.md#principled-implementation Subtract the displacement that a local rotation would add to the support and add the opposite displacement to the ankle goal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Compose one rotation then apply one pivot correction.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the given local contact in the limb goal so that joint limit correction retains it.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant rotation and vector arithmetic.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the engine's quaternion and vector operators. Ice and snow use the same pivot.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure query which retains no records.
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
