import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanArmClearance } from "../posture/HumanArmClearance";

/** The two arms. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/**
 * A plan whose arms, written as joints with no hand goal, swing out by the
 * least abduction that clears the thighs as the tangle audit measures it
 * (`HumanArmClearance.swung`): a gliding or riding body's hanging arms
 * would otherwise lay their fingers into the thighs the legs bring under
 * them. An arm with a hand goal is the fit's to clear and is left alone.
 *
 * @param plan The plan.
 * @param body The body.
 * @param sides The arms that hang, both when absent; an arm the plan lays on something (a hand on a rail) is left out.
 * @returns The plan with its hanging arms let out.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which arms move, by what rule and which are left alone.
 * @evidence contracts/development/implementation.md#principled-implementation The least abduction the tangle audit's own measure allows, read by the clearance owner.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One posture wrapper.
 * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond the clearance owner's rule.
 * @evidence contracts/development/implementation.md#efficient-algorithms One clearance read per posture, forwarding the caller's FK source and range projector.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work `HumanArmClearance.swung`, the one owner of a hanging arm's clearance.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the plan and the body only.
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
      HumanArmClearance.swung(
        body,
        plan.posture(...args),
        sides,
        args[2],
        args[3],
      ),
  };
}
