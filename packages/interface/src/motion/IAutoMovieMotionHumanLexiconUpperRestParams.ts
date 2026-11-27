import type { IAutoMovieMotionHumanRest } from "./IAutoMovieMotionHumanRest";

/**
 * Open parameters of the upperRest lexicon family, keyed by each runtime export
 * name.
 */
export interface IAutoMovieMotionHumanLexiconUpperRestParams {
  /** `rest` with both hands at `side`. */
  restSide: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** `rest` with both hands at `pocket`. */
  restPocket: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** `rest` with both hands at `hip`. */
  restHip: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** `rest` with both hands at `crossed`. */
  restCrossed: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** `rest` with both hands at `claspedFront`. */
  restClaspedFront: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** `rest` with both hands at `claspedBehind`. */
  restClaspedBehind: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** `rest` with both hands at `behindHead`. */
  restBehindHead: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** `rest` with both hands at `chinRest`. */
  restChinRest: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;

  /** `rest` with both hands at `elbowSupport`. */
  restElbowSupport: Omit<IAutoMovieMotionHumanRest.IParams, "left" | "right">;
}
