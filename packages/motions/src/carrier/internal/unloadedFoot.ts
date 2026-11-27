import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanMountPush } from "../../lexicon/internal/HumanMountPush";

/*
 * A leg goal whose foot bears nothing, turned toes down about its ankle as far
 * as its ankle would otherwise dorsiflex past what a weightless ankle holds
 * (`HumanMountPush.DORSAL`). The bend is the one `HumanMountPush.bend` reads:
 * the shank's lean off the foot's normal in the plane the knee bends in, about
 * the goal's own pole, the plane the limb fit bends the knee in and the reading
 * the verdicts take. The ankle stays where the goal puts it, so the knee does
 * not move and the turn by the excess about the knee's hinge leaves the ankle
 * bent by exactly the limit.
 * Parameter body: The body.
 * Parameter hip: The leg's hip joint, world metres.
 * Parameter goal: The leg goal, its foot turned by `rotation`.
 * Parameter weight: The share of the turn applied, 0 to 1: a caller easing the foot
 * in and out of its plants passes less than 1 near them.
 * Returns: The goal, its foot turned down when it must be; unchanged otherwise.
 */
export function unloadedFoot(
  body: IAutoMovieMotionHumanBody,
  hip: IAutoMovieVector3,
  goal: IAutoMovieHumanLimbGoal,
  weight: number = 1,
): IAutoMovieHumanLimbGoal {
  if (goal.rotation === undefined) return goal;
  const bent: HumanMountPush.IBend | null = HumanMountPush.bend(
    body,
    hip,
    goal.point,
    goal.bend,
    goal.rotation,
  );
  if (bent === null) return goal;
  const excess: number = weight * (bent.dorsiflexion - HumanMountPush.DORSAL);
  if (excess <= 0) return goal;
  return {
    ...goal,
    rotation: Quaternion.multiply(
      Quaternion.fromAxisAngle(bent.axis, excess),
      goal.rotation,
    ),
  };
}
