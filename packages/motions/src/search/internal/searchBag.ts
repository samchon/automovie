import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanSearch,
} from "@automovie/interface";

import { RUMMAGE } from "./RUMMAGE";

/*
 * Search the bag floor. A found-item request adds a pickup.
 * Parameter chain: The searcher's chain, standing within reach of the bag's
 * opening.
 * Parameter params: The bag, hand and authored outcome.
 * Returns: The chain with the search appended.
 */
export function searchBag<Chain extends IAutoMovieMotionHumanChainCore>(
  chain: Chain,
  params: IAutoMovieMotionHumanSearch.BagSearch,
): Chain {
  const hand: AutoMovieHumanSide = params.hand ?? "right";
  const searched: Chain = chain.act("touch", {
    target: { kind: "prop", subject: params.bag, point: "inside" },
    hand,
    kind: "rub",
    effector: "fingertips",
    count: RUMMAGE,
  });
  if (isNoFind(params)) return searched;
  return searched.act("pickUp", {
    prop: params.item,
    handle: params.handle,
    hand,
    lift: params.depth,
  });
}

function isNoFind(
  params: IAutoMovieMotionHumanSearch.BagSearch,
): params is IAutoMovieMotionHumanSearch.INoFind {
  return "type" in params && params.type === "no-find";
}
