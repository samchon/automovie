import type { IAutoMovieMotionHumanRoll } from "../floor/IAutoMovieMotionHumanRoll";

/**
 * Open parameters of the floorRoll lexicon family, keyed by each runtime export
 * name.
 */
export interface IAutoMovieMotionHumanLexiconFloorRollParams {
  /** A forward roll: crouch, roll over the back forward, rise on the feet. */
  forwardRoll: Omit<IAutoMovieMotionHumanRoll.IParams, "direction">;

  /** A backward roll: crouch, roll over the back backward, rise on the feet. */
  backwardRoll: Omit<IAutoMovieMotionHumanRoll.IParams, "direction">;
}
