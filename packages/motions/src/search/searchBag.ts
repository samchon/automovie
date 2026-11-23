import type {
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanSearch,
} from "@automovie/interface";

import { RUMMAGE } from "./RUMMAGE";

/**
 * Rummage in the bag, then take the item out by its grip.
 *
 * @param chain The searcher's chain, standing within reach of the bag's opening.
 * @param params The `bag`, `item`, `handle`, `depth` and `hand` (the right when absent).
 * @returns The chain with the search appended.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the order, the lift out of the bag and the hand.
 * @evidence contracts/development/implementation.md#principled-implementation The shipped fingertip rub on the bag's `inside` surface, `RUMMAGE` strokes, then the shipped pick-up of the item, its wrist rising the bag's depth: the grip holds the item rigidly, so the item rises as far as the wrist does and clears an opening that lies `depth` above the floor it lay on.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two appends.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The composed actions plan and refuse.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two appends.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function searchBag<Chain extends IAutoMovieMotionHumanChainCore>(
  chain: Chain,
  params: IAutoMovieMotionHumanSearch.ISearchBag,
): Chain {
  const hand = params.hand ?? "right";
  return chain
    .act("touch", {
      target: { kind: "prop", subject: params.bag, point: "inside" },
      hand,
      kind: "rub",
      effector: "fingertips",
      count: RUMMAGE,
    })
    .act("pickUp", {
      prop: params.item,
      handle: params.handle,
      hand,
      lift: params.depth,
    });
}