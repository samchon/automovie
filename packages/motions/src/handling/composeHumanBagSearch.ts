import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanChainCore,
} from "@automovie/interface";

/**
 * Searching a bag composed from shipped actions (#4016): the hand reaches
 * through the bag's opening and rummages over its floor (`touch`, rubbing
 * with the fingertips on its `inside` surface), then takes the item it finds
 * by its grip and lifts it out through the opening (`pickUp`), as high as the bag is deep. A bag a hand
 * reaches into is open at the top, as `createBag`'s tote is.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the reach, the rummage, the take and what the bag must be.
 * @evidence contracts/development/design.md#principled-representation Each act is data over the shipped touch and pick-up, targeting the bag's named surface and the item's grip.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One composition and its count.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No posture is authored here; the composed actions plan and refuse.
 */
export namespace composeHumanBagSearch {
  /** Rummaging strokes over the bag's floor before the item is taken (provisional). */
  export const RUMMAGE: number = 3;

  /**
   * Rummage in the bag, then take the item out by its grip.
   *
   * @param chain The searcher's chain, standing within reach of the bag's opening.
   * @param bag The open bag's subject.
   * @param item The item's subject, lying inside the bag.
   * @param handle The item's grip affordance.
   * @param depth The bag's opening height above its floor, metres: the take lifts the item that far, so an item lying on the floor comes out above the opening.
   * @param hand The searching hand; the right when absent.
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
  export function search<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    bag: string,
    item: string,
    handle: string,
    depth: number,
    hand: AutoMovieHumanSide = "right",
  ): Chain {
    return chain
      .act("touch", {
        target: { kind: "prop", subject: bag, point: "inside" },
        hand: hand,
        kind: "rub",
        effector: "fingertips",
        count: RUMMAGE,
      })
      .act("pickUp", { prop: item, handle, hand, lift: depth });
  }
}
