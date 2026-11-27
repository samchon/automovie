import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanHand,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
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
 * Parameter grasp: The wrist and hand attitude of one grasp on the handle, world.
 * Parameter point: The grip point on the handle's line, world metres.
 * Parameter axis: The handle's line, a unit direction.
 * Parameter toward: The point the wrist is brought nearest, world metres.
 * Returns: The rolled grasp.
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
    AutoMovieEngineVector3.subtract(v, AutoMovieEngineVector3.scale(axis, AutoMovieEngineVector3.dot(v, axis)));
  const offset: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(grasp.point, point);
  const p: IAutoMovieVector3 = across(offset);
  const q: IAutoMovieVector3 = across(AutoMovieEngineVector3.subtract(toward, point));
  if (AutoMovieEngineVector3.length(p) < 1e-9 || AutoMovieEngineVector3.length(q) < 1e-9) return grasp;
  const degrees: number =
    (Math.atan2(AutoMovieEngineVector3.dot(axis, AutoMovieEngineVector3.cross(p, q)), AutoMovieEngineVector3.dot(p, q)) *
      180) /
    Math.PI;
  const roll: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(axis, degrees);
  return {
    point: AutoMovieEngineVector3.add(point, AutoMovieEngineQuaternion.rotateVector(roll, offset)),
    rotation: AutoMovieEngineQuaternion.normalize(AutoMovieEngineQuaternion.multiply(roll, grasp.rotation)),
  };
}
