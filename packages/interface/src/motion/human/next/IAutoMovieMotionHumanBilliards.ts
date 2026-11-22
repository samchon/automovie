import type { IAutoMovieMotionHumanPrecisionDeck } from "../sport/IAutoMovieMotionHumanPrecisionDeck";

/**
 * Cue sports and putting greens: the credit of the balls a baked precision shot drops into a pocket or a cup. The shot is baked by `AutoMovieMotionHumanBilliards.bakePrecisionDeck`; `readPocketed` is a reader of that bake, so it returns its named result and no chain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the behaviour credits and how its result is read.
 * @evidence contracts/development/design.md#principled-representation One reader over the precision deck's own records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The pocket credit and nothing the precision deck owns.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The reader takes the deck's own records; nothing is redefined.
 */
export interface IAutoMovieMotionHumanBilliards {
  /**
   * Credit the balls a baked precision shot drops into a pocket or a cup, in the order they drop. A ball is credited at the first cache frame where its centre is more than one radius below the bed plane, to the mouth whose plan reach holds it at that frame; a ball that falls below the bed outside every reach left the table over a rail and is never credited.
   *
   * @param params The `balls`, the `pockets` and the baked `result`.
   * @returns The pocketed balls in drop order; empty when none drops.
   * @throws {RangeError} When a ball has no sphere shape, there is no pocket, or a ball is missing from the cache.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the method does, its parameters and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBilliards.readPocketed is provided by the runtime namespace that implements it.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBilliards.readPocketed is provided by the runtime namespace that implements it.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBilliards.readPocketed is provided by the runtime namespace that implements it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBilliards.readPocketed is provided by the runtime namespace that implements it.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBilliards.readPocketed is provided by the runtime namespace that implements it.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBilliards.readPocketed is provided by the runtime namespace that implements it.
   */
  readPocketed(
    params: IAutoMovieMotionHumanBilliards.IReadPocketed,
  ): IAutoMovieMotionHumanBilliards.IPocketed;
}

/**
 * The parameter and result types of the billiards reader.
 */
export namespace IAutoMovieMotionHumanBilliards {
  /**
   * The parameters of `readPocketed`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what the reader takes from the shot.
   * @evidence contracts/development/design.md#principled-representation The balls, the pocket mouths and the baked shot, all the precision deck's own records.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only what the pocket credit reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The balls, pockets and result are the deck's records, not copies.
   */
  export interface IReadPocketed {
    /** The ball and target balls to credit, each one rigid sphere whose centre of mass is its centre. */
    balls: readonly IAutoMovieMotionHumanPrecisionDeck.IRigid[];

    /** The table's pocket mouths at bed height. */
    pockets: readonly IAutoMovieMotionHumanPrecisionDeck.IPocket[];

    /** The baked shot. */
    result: IAutoMovieMotionHumanPrecisionDeck.IResult;
  }

  /**
   * The balls a shot dropped, in drop order: `IAutoMovieMotionHumanPrecisionDeck.IPocketed` records.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the list holds and its order.
   * @evidence contracts/development/design.md#principled-representation An array of the precision deck's own pocketed-ball record, with its ball, pocket and film second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The result of `readPocketed` only.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the record is the deck's, not redefined.
   */
  export type IPocketed = IAutoMovieMotionHumanPrecisionDeck.IPocketed[];
}
