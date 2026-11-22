import type { IAutoMovieMotionHumanChainCore } from "@automovie/interface";

import { shiftStandingWeight } from "../everyday/shiftStandingWeight";
import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Stage a slow dance's sway on planted feet (#4012): the weight goes over
 * one foot and back, then over the other and back, `count` times, each half
 * of a sway a beat long, as a couple in a slow dance hold sways to the
 * music. Each shift is `shiftStandingWeight` toward the performer's left,
 * then right, by `by` metres with its return, so the law's own plant and
 * balance checks stand. A partner resting a cheek on this performer's
 * (`headRest`) follows the sway by its felt correction.
 *
 * @param chain The swaying performer's chain.
 * @param params How far the pelvis goes, the beat and how many sways.
 * @returns The same kind of chain with the shifts appended.
 * @throws {HumanRefusal} When the count is not a whole number of one or more.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the movement, its timing, the law it reuses and how a partner follows it.
 * @evidence contracts/development/implementation.md#principled-implementation Each half sway is one planted weight shift and its return on the beat.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Appends two shifts per sway through the chain operator.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The shift's own refusals stand; the beat and the distance are the author's.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two appended actions per sway.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reuses the shift law; separate sways share no computation.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The result owns the appended intents; the composer retains no state.
 */
export function composeHumanSlowDanceSway<
  Chain extends IAutoMovieMotionHumanChainCore,
>(chain: Chain, params: composeHumanSlowDanceSway.IParams): Chain {
  if (!(Number.isInteger(params.count) && params.count >= 1))
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
        seconds: params.beat / 2,
        returnSeconds: params.beat / 2,
      });
  return out;
}

/**
 * Companion types of {@link composeHumanSlowDanceSway}.
 */
export namespace composeHumanSlowDanceSway {
  /** A sway's size, beat and repetitions. */
  export interface IParams {
    /** How far the pelvis goes over each foot, metres; positive. */
    by: number;

    /** The beat, seconds: each half of a sway, over one foot and back, takes one. */
    beat: number;

    /** How many sways, each over the left foot and then the right. */
    count: number;
  }
}
