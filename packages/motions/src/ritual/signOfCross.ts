import type {
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanRitual,
} from "@automovie/interface";

import { SITE } from "./SITE";
import { TOUCH_HOLD } from "./TOUCH_HOLD";

/**
 * Append the sign of the cross: forehead, sternum, then both shoulders in the
 * rite's order, with one hand's fingertips.
 *
 * @param chain The performer's chain.
 * @param params The signing `hand` (the right when absent) and the `rite` (the
 *   Latin rite when absent).
 * @returns The chain with four touches appended.
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
    (current: Chain, region: IAutoMovieMotionHumanRitual.ICrossRegion): Chain =>
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
