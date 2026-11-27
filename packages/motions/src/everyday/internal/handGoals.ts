import type {
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";

/*
 * Arm goals that put hand surfaces on their points, the contact first and the
 * hand's turn as close as the arm allows.
 *
 * A hand goal names a surface, a point and a hand rotation. Each wrist is
 * placed for the asked rotation and the surface is declared as the goal's
 * contact (`AutoMovieMotionHumanArm.goal`), so where the arm cannot turn the
 * hand as asked the posture resolver re-aims the wrist until the surface stays
 * on its point and the rotation gives way.
 * Parameter body: The body.
 * Parameter posture: The posture the arms are added to.
 * Parameter requests: One target per moving hand; a target's `curl` is not read
 * here.
 * Returns: The posture with the arm goals set.
 */
export function handGoals(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  requests: readonly IAutoMovieMotionHumanArmTarget.ISided[],
): IAutoMovieMotionHumanPosture {
  if (requests.length === 0) return posture;
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
  for (const r of requests)
    limbs[`${r.side}Arm`] = AutoMovieMotionHumanArm.goal(body, r.side, r);
  return { ...posture, limbs };
}
