import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanDance } from "./IAutoMovieMotionHumanDance";

/**
 * Conducting with a held baton: its tip beats the standard figure of the meter
 * on the beat clock, the ictus, the tip's lowest point of each beat, falling on
 * the beat's instant. The figures follow Max Rudolf, _The Grammar of
 * Conducting_ (3rd ed., Schirmer, 1995): 2/4 down and up, 3/4 down, out and up,
 * 4/4 down, in, out and up, "in" toward the body's midline and "out" away from
 * it for the baton hand.
 */
export namespace IAutoMovieMotionHumanConduct {
  /** The meter whose figure the baton beats. */
  export type Meter = "2/4" | "3/4" | "4/4";

  /** The parameters of `conduct`. */
  export interface IParams {
    /** The held baton's subject id; its `tip` is the beating point. */
    baton: string;

    /** The meter. */
    meter: Meter;

    /** Bars to beat; 2 when absent. */
    bars?: number;

    /** Beats per minute; 120 when absent. */
    bpm?: number;

    /**
     * A cue track whose beats the ictuses fall on, as a dance locks to it;
     * `bpm` is then not read.
     */
    lock?: IAutoMovieMotionHumanDance.IParams["lock"];

    /** The baton hand; the one holding the baton at entry when absent. */
    hand?: AutoMovieHumanSide;
  }
}
