import type {
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanRitual,
} from "@automovie/interface";

import { SITE } from "./SITE";
import { TOUCH_HOLD } from "./TOUCH_HOLD";

/**
 * Append the sign of the cross: forehead, sternum, then both shoulders in
 * the rite's order, with one hand's fingertips.
 *
 * @param chain The performer's chain.
 * @param params The signing `hand` (the right when absent) and the `rite` (the Latin rite when absent).
 * @returns The chain with four touches appended.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the order and both defaults.
 * @evidence contracts/development/implementation.md#principled-implementation Four fingertip touches on the named self regions in the traditional order.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered list of regions, one touch each.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The touch law fits and refuses every contact; nothing is posed here.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Four appends.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function signOfCross<Chain extends IAutoMovieMotionHumanChainCore>(
  chain: Chain,
  params: IAutoMovieMotionHumanRitual.ISignOfCross,
): Chain {
  const hand = params.hand ?? "right";
  const order: readonly IAutoMovieMotionHumanRitual.ICrossRegion[] =
    (params.rite ?? "latin") === "latin"
      ? ["forehead", "sternum", "shoulderLeft", "shoulderRight"]
      : ["forehead", "sternum", "shoulderRight", "shoulderLeft"];
  return order.reduce(
    (
      current: Chain,
      region: IAutoMovieMotionHumanRitual.ICrossRegion,
    ): Chain =>
      current.act("touch", {
        target: { kind: "self", region },
        hand,
        kind: "hold",
        effector: "fingertips",
        hold: TOUCH_HOLD,
        // The patch of each region nearest the signing shoulder: the front
        // of the shoulder a hand reaches across the chest, not its top.
        site: { rule: "reach", within: SITE },
      }),
    chain,
  );
}