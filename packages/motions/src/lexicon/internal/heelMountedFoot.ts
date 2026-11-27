import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRange } from "../../compose/internal/AutoMovieMotionHumanRange";

/*
 * A foot bearing on its ball, turned toes-down about the ball by as much as the
 * shank leans forward past the ankle's dorsiflexion range, so the ball keeps
 * its stirrup where a rider's knees come forward over the feet out of the
 * saddle. The knee is where the leg's two bones meet in the plane of the hip,
 * the ankle and the goal's bend point; the lean is the shank's angle from the
 * foot's own up toward its front.
 * Parameter body: The body.
 * Parameter side: The leg.
 * Parameter goal: The leg's goal, its point the ankle, with the ball as its
 * contact.
 * Parameter hip: The hip joint, in the goal's frame.
 * Parameter limit: The dorsiflexion the ankle may reach, degrees; the range table's
 * loaded limit when absent, the unloaded one for a foot hanging free.
 * Returns: The goal turned about its ball where the ankle would pass its range;
 * the goal itself otherwise, or when it names no contact or rotation.
 */
export function heelMountedFoot(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  goal: IAutoMovieHumanLimbGoal,
  hip: IAutoMovieVector3,
  limit?: number,
): IAutoMovieHumanLimbGoal {
  const range: number | null =
    limit ?? AutoMovieMotionHumanRange.limit(`${side}Foot`, "flexion");
  if (
    goal.contact === undefined ||
    goal.rotation === undefined ||
    range === null
  )
    return goal;
  const a: number = body.measure.thigh;
  const b: number = body.measure.shank;
  const toward: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(goal.point, hip);
  const d: number = AutoMovieEngineVector3.length(toward);
  if (!(d > Math.abs(a - b) && d < a + b)) return goal;
  const u: IAutoMovieVector3 = AutoMovieEngineVector3.scale(toward, 1 / d);
  const aside: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(goal.bend, hip);
  const across: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    aside,
    AutoMovieEngineVector3.scale(u, AutoMovieEngineVector3.dot(aside, u)),
  );
  if (AutoMovieEngineVector3.length(across) < 1e-9) return goal;
  const v: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(across);
  const cos: number = (a * a + d * d - b * b) / (2 * a * d);
  const knee: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    hip,
    AutoMovieEngineVector3.add(
      AutoMovieEngineVector3.scale(u, a * cos),
      AutoMovieEngineVector3.scale(v, a * Math.sqrt(Math.max(0, 1 - cos * cos))),
    ),
  );
  const shank: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
    AutoMovieEngineVector3.subtract(knee, goal.point),
  );
  const up: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(goal.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const front: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(goal.rotation, {
    x: 0,
    y: 0,
    z: 1,
  });
  const lean: number =
    (Math.atan2(AutoMovieEngineVector3.dot(shank, front), AutoMovieEngineVector3.dot(shank, up)) * 180) /
    Math.PI;
  const excess: number = lean - range;
  if (!(excess > 0)) return goal;

  // Toes down about the ball: the foot's lateral axis, the ball held still.
  const lateral: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(goal.rotation, {
    x: 1,
    y: 0,
    z: 0,
  });
  const ball: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    goal.point,
    AutoMovieEngineQuaternion.rotateVector(goal.rotation, goal.contact),
  );
  const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
    AutoMovieEngineQuaternion.fromAxisAngle(lateral, excess),
    goal.rotation,
  );
  return {
    ...goal,
    rotation,
    point: AutoMovieEngineVector3.subtract(
      ball,
      AutoMovieEngineQuaternion.rotateVector(rotation, goal.contact),
    ),
  };
}
