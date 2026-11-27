import type { IAutoMovieMotionHumanPrecisionDeck } from "./IAutoMovieMotionHumanPrecisionDeck";

/**
 * Authoring inputs and results for the bowling slide and pinfall reader.
 */
/** The authorable input and result types for bowling operations. */
export namespace IAutoMovieMotionHumanBowling {
  /** The parameters of `readPinfall`. */
  export interface IReadPinfall {
    /** The placed pins, each upright on its base with +Y along its axis. */
    pins: readonly IAutoMovieMotionHumanPrecisionDeck.IRigid[];

    /** The baked deck whose cache holds the pins. */
    result: IAutoMovieMotionHumanPrecisionDeck.IResult;
  }

  /** The ids of the pins down at the cache end, in rack order. */
  export type IPinfall = string[];
}
