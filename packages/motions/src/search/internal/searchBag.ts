import type {
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanSearch,
} from "@automovie/interface";

import { RUMMAGE } from "./RUMMAGE";

/*
 * Rummage in the bag, then take the item out by its grip.
 * Parameter chain: The searcher's chain, standing within reach of the bag's
 * opening.
 * Parameter params: The `bag`, `item`, `handle`, `depth` and `hand` (the right when
 * absent).
 * Returns: The chain with the search appended.
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
