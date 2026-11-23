import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Searching a bag composed from shipped actions: the hand reaches through the
 * bag's opening and rummages over its floor (`touch`, rubbing with the
 * fingertips on its `inside` surface), then takes the item it finds by its grip
 * and lifts it out through the opening (`pickUp`), as high as the bag is deep.
 * A bag a hand reaches into is open at the top, as `createBag`'s tote is. The
 * rummaging strokes are the namespace constant `RUMMAGE` of
 * `AutoMovieMotionHumanSearch` (provisional).
 *
 * The method is a helper over a chain: it takes the chain first and returns it
 * with the actions appended, as the runtime namespace takes it.
 *
 * @template Chain The chain the method takes and returns.
 */
export interface IAutoMovieMotionHumanSearch<Chain> {
  /**
   * Rummage in the bag, then take the item out by its grip.
   *
   * @param chain The searcher's chain, standing within reach of the bag's
   *   opening.
   * @param params The `bag`, `item`, `handle`, `depth` and `hand` of
   *   `IAutoMovieMotionHumanSearch.ISearchBag`.
   * @returns The chain with the search appended.
   */
  searchBag(
    chain: Chain,
    params: IAutoMovieMotionHumanSearch.ISearchBag,
  ): Chain;
}

/** The parameter types of the Search methods. */
export namespace IAutoMovieMotionHumanSearch {
  /** The parameters of `searchBag`. */
  export interface ISearchBag {
    /** The open bag's subject. */
    bag: string;

    /** The item's subject, lying inside the bag. */
    item: string;

    /** The item's grip affordance. */
    handle: string;

    /**
     * The bag's opening height above its floor, metres: the take lifts the item
     * that far, so an item lying on the floor comes out above the opening.
     */
    depth: number;

    /** The searching hand; the right when absent. */
    hand?: AutoMovieHumanSide;
  }
}
