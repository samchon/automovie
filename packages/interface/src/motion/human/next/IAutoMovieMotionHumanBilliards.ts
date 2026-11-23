import type { IAutoMovieMotionHumanPrecisionDeck } from "../sport/IAutoMovieMotionHumanPrecisionDeck";

/**
 * Cue sports and putting greens: the credit of the balls a baked precision shot
 * drops into a pocket or a cup. The shot is baked by
 * `AutoMovieMotionHumanBilliards.bakePrecisionDeck`; `readPocketed` is a reader
 * of that bake, so it returns its named result and no chain.
 */
export interface IAutoMovieMotionHumanBilliards {
  /**
   * Credit the balls a baked precision shot drops into a pocket or a cup, in
   * the order they drop. A ball is credited at the first cache frame where its
   * centre is more than one radius below the bed plane, to the mouth whose plan
   * reach holds it at that frame; a ball that falls below the bed outside every
   * reach left the table over a rail and is never credited.
   *
   * A reader, not a chain method:
   * `AutoMovieMotionHumanBilliards.readPocketed(params)` returns its result and
   * appends no action.
   *
   * @param params The `balls`, the `pockets` and the baked `result`.
   * @returns The pocketed balls in drop order; empty when none drops.
   * @throws {RangeError} When a ball has no sphere shape, there is no pocket,
   *   or a ball is missing from the cache.
   */
  readPocketed(
    params: IAutoMovieMotionHumanBilliards.IReadPocketed,
  ): IAutoMovieMotionHumanBilliards.IPocketed;
}

/** The parameter and result types of the billiards reader. */
export namespace IAutoMovieMotionHumanBilliards {
  /** The parameters of `readPocketed`. */
  export interface IReadPocketed {
    /**
     * The ball and target balls to credit, each one rigid sphere whose centre
     * of mass is its centre.
     */
    balls: readonly IAutoMovieMotionHumanPrecisionDeck.IRigid[];

    /** The table's pocket mouths at bed height. */
    pockets: readonly IAutoMovieMotionHumanPrecisionDeck.IPocket[];

    /** The baked shot. */
    result: IAutoMovieMotionHumanPrecisionDeck.IResult;
  }

  /**
   * The balls a shot dropped, in drop order:
   * `IAutoMovieMotionHumanPrecisionDeck.IPocketed` records.
   */
  export type IPocketed = IAutoMovieMotionHumanPrecisionDeck.IPocketed[];
}
