import type { IAutoMovieMotionHumanPrecisionDeck } from "./IAutoMovieMotionHumanPrecisionDeck";

/**
 * Authoring inputs and results for reading pocketed balls from a baked
 * precision shot.
 */
/** The authorable input and result types for the billiards reader. */
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
