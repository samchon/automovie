import type {
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanDance,
} from "@automovie/interface";

import { shiftStandingWeight } from "../everyday/shiftStandingWeight";
import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Stage a slow dance's sway on planted feet: the weight goes over one foot and
 * back, then over the other and back, `count` times, each half of a sway a beat
 * long, as a couple in a slow dance hold sways to the music. Each shift is
 * `shiftStandingWeight` toward the performer's left, then right, by `by` metres
 * with its return, so the law's own plant and balance checks stand. A partner
 * resting a cheek on this performer's (`headRest`) follows the sway by its felt
 * correction.
 *
 * @param chain The swaying performer's chain.
 * @param params How far the pelvis goes, the beat and how many sways.
 * @returns The same kind of chain with the shifts appended.
 * @throws {HumanRefusal} When the count is not a whole number of one or more.
 */
export function composeHumanSlowDanceSway<
  Chain extends IAutoMovieMotionHumanChainCore,
>(chain: Chain, params: IAutoMovieMotionHumanDance.ISlowDanceSway): Chain {
  if (!(params.count >= 1))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "count",
      value: params.count,
      reason: "a sway is repeated a whole number of times, one or more",
      fix: "give a positive whole count",
    });
  let out: Chain = chain;
  for (let i: number = 0; i < params.count; ++i)
    for (const sign of [1, -1])
      out = out.registered(shiftStandingWeight.name, {
        by: sign * params.by,
        duration: params.beat / 2,
        returnSeconds: params.beat / 2,
      });
  return out;
}
