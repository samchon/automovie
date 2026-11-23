import type { IAutoMovieLoftChain } from "../../construction/IAutoMovieLoftChain";
import type { IAutoMovieHumanTrunkInputs } from "./IAutoMovieHumanTrunkInputs";
import type { IAutoMovieHumanTrunkNeckSeat } from "./IAutoMovieHumanTrunkNeckSeat";

/**
 * Type contracts exchanged by AutoMovieHumanTrunkSolver; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanTrunkSolver {
  /** The fixed inputs of a solve. */
  export interface IFixed {
    /** The person's tapes, courses and controls in calibration millimetres. */
    inputs: IAutoMovieHumanTrunkInputs;

    /** Stature in calibration millimetres. */
    stature: number;

    /** Height of the crotch ring, mm. */
    crotch: number;

    /**
     * Already requested legacy neck chain; absent during direct original
     * preparation.
     */
    neck?: IAutoMovieLoftChain;

    /**
     * Same physical internal cut's original support descriptor, before any
     * chain.
     */
    neckBoundary?: IAutoMovieHumanTrunkNeckSeat.ISeat;

    /**
     * Explicit legacy raw supplier; original solving and metadata never call
     * it.
     */
    rawNeck?: () => IAutoMovieLoftChain;

    /**
     * The thigh tape, mm, for the groin width; absent, the references' median
     * ratio is used.
     */
    thigh?: number;

    /** The crotch ring's half girth over the thigh tape, as the leg reports it. */
    groinRatio?: number;
  }
}
