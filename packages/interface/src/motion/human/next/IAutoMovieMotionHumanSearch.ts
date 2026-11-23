import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Searching a bag composed from shipped actions (#4016): the hand reaches through the bag's opening and rummages over its floor (`touch`, rubbing with the fingertips on its `inside` surface), then takes the item it finds by its grip and lifts it out through the opening (`pickUp`), as high as the bag is deep. A bag a hand reaches into is open at the top, as `createBag`'s tote is. The rummaging strokes are the namespace constant `RUMMAGE` of `AutoMovieMotionHumanSearch` (provisional).
 *
 * The method is a helper over a chain: it takes the chain first and returns it with the actions appended, as the runtime namespace takes it.
 *
 * @template Chain The chain the method takes and returns.
 * @evidence contracts/development/common.md#meaningful-documentation States the reach, the rummage, the take and what the bag must be.
 * @evidence contracts/development/design.md#principled-representation One method of the Search behaviour, taking one named parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one composition the bag scenes use and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No posture is authored here; the touch and pick-up laws plan and refuse.
 */
export interface IAutoMovieMotionHumanSearch<Chain> {
  /**
   * Rummage in the bag, then take the item out by its grip.
   *
   * @param chain The searcher's chain, standing within reach of the bag's opening.
   * @param params The `bag`, `item`, `handle`, `depth` and `hand` of `IAutoMovieMotionHumanSearch.ISearchBag`.
   * @returns The chain with the search appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order, the lift out of the bag and the hand.
   */
  searchBag(
    chain: Chain,
    params: IAutoMovieMotionHumanSearch.ISearchBag,
  ): Chain;
}

/**
 * The parameter types of the Search methods.
 */
export namespace IAutoMovieMotionHumanSearch {
  /**
   * The parameters of `searchBag`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation The bag, the item, its grip, the bag's depth and the searching hand.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members `searchBag` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The subjects are names, never poses; the depth is the bag's authored opening height.
   */
  export interface ISearchBag {
    /** The open bag's subject. */
    bag: string;

    /** The item's subject, lying inside the bag. */
    item: string;

    /** The item's grip affordance. */
    handle: string;

    /** The bag's opening height above its floor, metres: the take lifts the item that far, so an item lying on the floor comes out above the opening. */
    depth: number;

    /** The searching hand; the right when absent. */
    hand?: AutoMovieHumanSide;
  }
}
