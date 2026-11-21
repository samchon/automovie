import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";

/**
 * A foot bearing on its ball, turned toes-down about the ball by as much as the shank leans forward past the ankle's dorsiflexion range, so the ball keeps its stirrup where a rider's knees come forward over the feet out of the saddle. The knee is where the leg's two bones meet in the plane of the hip, the ankle and the goal's bend point; the lean is the shank's angle from the foot's own up toward its front.
 *
 * @param body The body.
 * @param side The leg.
 * @param goal The leg's goal, its point the ankle, with the ball as its contact.
 * @param hip The hip joint, in the goal's frame.
 * @returns The goal turned about its ball where the ankle would pass its range; the goal itself otherwise, or when it names no contact or rotation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the turn, its pivot, the knee's construction and when nothing changes.
 * @evidence contracts/development/implementation.md#principled-implementation The two-bone triangle by the law of cosines places the knee; the shank's forward lean against the foot's up is compared with the range table's dorsiflexion (`AutoMovieMotionHumanRange.limit`), and the excess turns the foot about its lateral axis through the ball, the ball held still.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The knee, the lean, then one rotation about the ball.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A leg out of its reach, or a range table without a dorsiflexion limit, leaves the goal as it is.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read per sample.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function heelMountedFoot(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  goal: IAutoMovieHumanLimbGoal,
  hip: IAutoMovieVector3,
): IAutoMovieHumanLimbGoal {
  const range: number | null = AutoMovieMotionHumanRange.limit(
    `${side}Foot`,
    "flexion",
  );
  if (
    goal.contact === undefined ||
    goal.rotation === undefined ||
    range === null
  )
    return goal;
  const a: number = body.measure.thigh;
  const b: number = body.measure.shank;
  const toward: IAutoMovieVector3 = Vector3.subtract(goal.point, hip);
  const d: number = Vector3.length(toward);
  if (!(d > Math.abs(a - b) && d < a + b)) return goal;
  const u: IAutoMovieVector3 = Vector3.scale(toward, 1 / d);
  const aside: IAutoMovieVector3 = Vector3.subtract(goal.bend, hip);
  const across: IAutoMovieVector3 = Vector3.subtract(
    aside,
    Vector3.scale(u, Vector3.dot(aside, u)),
  );
  if (Vector3.length(across) < 1e-9) return goal;
  const v: IAutoMovieVector3 = Vector3.normalize(across);
  const cos: number = (a * a + d * d - b * b) / (2 * a * d);
  const knee: IAutoMovieVector3 = Vector3.add(
    hip,
    Vector3.add(
      Vector3.scale(u, a * cos),
      Vector3.scale(v, a * Math.sqrt(Math.max(0, 1 - cos * cos))),
    ),
  );
  const shank: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(knee, goal.point),
  );
  const up: IAutoMovieVector3 = Quaternion.rotateVector(goal.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const front: IAutoMovieVector3 = Quaternion.rotateVector(goal.rotation, {
    x: 0,
    y: 0,
    z: 1,
  });
  const lean: number =
    (Math.atan2(Vector3.dot(shank, front), Vector3.dot(shank, up)) * 180) /
    Math.PI;
  const excess: number = lean - range;
  if (!(excess > 0)) return goal;

  // Toes down about the ball: the foot's lateral axis, the ball held still.
  const lateral: IAutoMovieVector3 = Quaternion.rotateVector(goal.rotation, {
    x: 1,
    y: 0,
    z: 0,
  });
  const ball: IAutoMovieVector3 = Vector3.add(
    goal.point,
    Quaternion.rotateVector(goal.rotation, goal.contact),
  );
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.fromAxisAngle(lateral, excess),
    goal.rotation,
  );
  return {
    ...goal,
    rotation,
    point: Vector3.subtract(
      ball,
      Quaternion.rotateVector(rotation, goal.contact),
    ),
  };
}
