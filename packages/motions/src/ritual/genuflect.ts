import type {
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanRitual,
} from "@automovie/interface";

import { GENUFLECT_HOLD } from "./GENUFLECT_HOLD";
import { signOfCross } from "./signOfCross";

/**
 * Append a genuflection: the right knee to the floor beside the left heel, a
 * brief rest, and the rise, with an optional sign of the cross first.
 *
 * @param chain The performer's chain.
 * @param params Whether to sign the `cross` before kneeling; `false` when
 *   absent.
 * @returns The chain with the genuflection appended.
 */
export function genuflect<Chain extends IAutoMovieMotionHumanChainCore>(
  chain: Chain,
  params: IAutoMovieMotionHumanRitual.IGenuflect,
): Chain {
  return ((params.cross ?? false) ? signOfCross(chain, {}) : chain).act(
    "kneel",
    {
      kind: "one",
      knee: "right",
      hold: GENUFLECT_HOLD,
      rise: true,
    },
  );
}
