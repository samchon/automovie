import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanHand,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A grasp on a handle rolled about the handle's line so its wrist lies nearest
 * a point, the shoulder of the arm that takes it: the free roll a power grip on
 * a cylinder leaves (grasp synthesis treats a cylindrical handle's grasps as
 * one family about its axis, Miller et al. 2003), chosen where the arm's
 * reachable workspace, a sphere about the shoulder, is nearest.
 *
 * Rolling the hand rigidly about the line through the grip point keeps the
 * wrist's offset along the line and turns its offset across it. The wrist comes
 * nearest the shoulder when that across offset points the way the shoulder lies
 * across the line, so the roll is the signed angle between the two across
 * directions, in closed form.
 *
 * @param grasp The wrist and hand attitude of one grasp on the handle, world.
 * @param point The grip point on the handle's line, world metres.
 * @param axis The handle's line, a unit direction.
 * @param toward The point the wrist is brought nearest, world metres.
 * @returns The rolled grasp.
 */
export function HumanGraspRoll(
  grasp: IAutoMovieMotionHumanHand.IWrist,
  point: IAutoMovieVector3,
  axis: IAutoMovieVector3,
  toward: IAutoMovieVector3,
): IAutoMovieMotionHumanHand.IWrist {
  const across: (v: IAutoMovieVector3) => IAutoMovieVector3 = (
    v: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Vector3.subtract(v, Vector3.scale(axis, Vector3.dot(v, axis)));
  const offset: IAutoMovieVector3 = Vector3.subtract(grasp.point, point);
  const p: IAutoMovieVector3 = across(offset);
  const q: IAutoMovieVector3 = across(Vector3.subtract(toward, point));
  if (Vector3.length(p) < 1e-9 || Vector3.length(q) < 1e-9) return grasp;
  const degrees: number =
    (Math.atan2(Vector3.dot(axis, Vector3.cross(p, q)), Vector3.dot(p, q)) *
      180) /
    Math.PI;
  const roll: IAutoMovieQuaternion = Quaternion.fromAxisAngle(axis, degrees);
  return {
    point: Vector3.add(point, Quaternion.rotateVector(roll, offset)),
    rotation: Quaternion.normalize(Quaternion.multiply(roll, grasp.rotation)),
  };
}
