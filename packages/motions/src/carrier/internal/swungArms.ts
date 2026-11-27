import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanArmSwing } from "../../posture/internal/HumanArmSwing";

/**
 * A plan whose arms, written as joints with no hand goal, swing out by the
 * least abduction that clears the thighs as the tangle audit measures it
 * (`HumanArmSwing`): a gliding or riding body's hanging arms would otherwise
 * lay their fingers into the thighs the legs bring under them. An arm with a
 * hand goal is the fit's to clear and is left alone.
 *
 * @param plan The plan.
 * @param body The body.
 * @param sides The arms that hang, both when absent; an arm the plan lays on
 *   something (a hand on a rail) is left out.
 * @returns The plan with its hanging arms let out.
 */
export function swungArms(
  plan: IAutoMovieMotionHumanActionPlan,
  body: IAutoMovieMotionHumanBody,
  sides: readonly AutoMovieHumanSide[] = SIDES,
): IAutoMovieMotionHumanActionPlan {
  if (sides.length === 0) return plan;
  return {
    ...plan,
    posture: (
      ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
    ): IAutoMovieMotionHumanPosture =>
      HumanArmSwing(body, plan.posture(...args), sides, args[2], args[3]),
  };
}

/** The two arms. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];
