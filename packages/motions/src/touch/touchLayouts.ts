import type { AutoMovieMotionTarget } from "@automovie/interface";

import type { HumanHand } from "../posture/HumanHand";
import type { touchHold } from "./touchHold";

/**
 * Share a touch's fixed entry-layout decisions during one plan construction.
 * Each declared hand/target pair is evaluated on first demand, preserving its
 * existing calculation order; callers receive fresh scalar layout records.
 *
 * @param hands The at-most-two hand/target pairs this touch actually plans.
 * @param read The layout calculation over this plan's fixed entry/body inputs.
 * @returns The same layout reader with completed declared decisions shared.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the declared-pair bound, lazy evaluation order, fixed-entry premise and fresh layout results.
 * @evidence contracts/development/implementation.md#principled-implementation A hand's tangent choice depends on its unchanged body, entry bones/posture, effector, target and authored touch parameters, so repeated reads in one synchronous plan build have the same scalar decision.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One small declared-pair lookup and one optional completed layout per pair; requests outside that list delegate normally.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The first request still runs the full physical hand-placement sweep; failed calculations are not stored, and no posture, fit, sampled frame or time answer is cached.
 * @evidence contracts/development/implementation.md#efficient-algorithms At most two declared pairs make lookup constant-sized; each full tangent sweep executes once per pair instead of once per timing/reference consumer. Every return copies the two scalar fields, with no measured speedup claim.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only exact declared hand plus target identity within this one plan build shares a completed decision; the caller fixes all entry/body/effector/parameter inputs for that synchronous lifetime.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan builder owns at most two layout records and releases the reader after its synchronous timing/primitive setup; returned primitives retain scalar decisions rather than this reader or entry-sweep results.
 */
export function touchLayouts(
  hands: readonly (readonly [HumanHand.Side, AutoMovieMotionTarget])[],
  read: touchHold.Lay,
): touchHold.Lay {
  const completed: (touchHold.ILaid | undefined)[] = [];
  return (side: HumanHand.Side, target: AutoMovieMotionTarget): touchHold.ILaid => {
    const index: number = hands.findIndex(
      ([hand, at]: readonly [HumanHand.Side, AutoMovieMotionTarget]): boolean =>
        hand === side && at === target,
    );
    if (index < 0) return read(side, target);
    return { ...(completed[index] ??= read(side, target)) };
  };
}
