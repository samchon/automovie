import { RUMMAGE as RUMMAGESource } from "../search/RUMMAGE";
import { searchBag as searchBagLaw } from "../search/searchBag";

/**
 * Searching a bag composed from shipped actions (#4016): the hand reaches through the bag's opening and rummages over its floor (`touch`, rubbing with the fingertips on its `inside` surface), then takes the item it finds by its grip and lifts it out through the opening (`pickUp`), as high as the bag is deep. A bag a hand reaches into is open at the top, as `createBag`'s tote is. The rummaging strokes are the namespace constant `RUMMAGE` of `AutoMovieMotionHumanSearch` (provisional).
 *
 * The method is a helper over a chain: it takes the chain first and returns it with the actions appended, as the runtime namespace takes it.
 *
 * Laws and helpers, each the shipped function under the family name:
 * - `searchBag`: Rummage in the bag, then take the item out by its grip.
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 * - `RUMMAGE`: Rummaging strokes over the bag's floor before the item is taken (provisional).
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by `typeof` and never wrapped, so its parameters, units, frames and refusals are those its own comment states. The family's shared model and each law's parameters are declared by {@link IAutoMovieMotionHumanSearch} in `@automovie/interface`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the family covers, how its members relate and where its model is declared.
 * @evidence contracts/development/design.md#principled-representation Each member is the shipped law, preset or row itself, so the units, frames and invariants are those its owner states.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members the family groups; each stays owned by its module.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is wrapped, widened or redefined, so no behaviour is added here.
 */
export namespace AutoMovieMotionHumanSearch {
  /**
   * Rummage in the bag, then take the item out by its grip.
   *
   * @param chain The searcher's chain, standing within reach of the bag's opening.
   * @param params The `bag`, `item`, `handle`, `depth` and `hand` (the right when absent).
   * @returns The chain with the search appended.
   */
  export const searchBag: typeof searchBagLaw = searchBagLaw;

  /**
   * Rummaging strokes over the bag's floor before the item is taken (provisional).
   */
  export const RUMMAGE: typeof RUMMAGESource = RUMMAGESource;
}
