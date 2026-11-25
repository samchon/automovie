import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanDance } from "../next/IAutoMovieMotionHumanDance";

/**
 * Street grooves on the beat clock: the rock, a bounce of the knees with the
 * chest and the head isolating side to side and popping hits that stop sharp on
 * their beat subdivisions; and the moonwalk's backslide, one foot standing on
 * its ball while the other slides back flat, the roles changing every beat.
 */
export namespace IAutoMovieMotionHumanStreetDance {
  /** The grooves. */
  export type Groove = "rock" | "moonwalk";

  /** Parameters. */
  export interface IParams {
    /** The groove. */
    groove: Groove;

    /** Beats per minute, positive; the dance law's `BPM` when absent. */
    bpm?: number;

    /**
     * How many beats, a whole number of at least 1; 8 when absent, at the dance
     * law's tempo (`dance.BPM`, 0.5 s a beat): 4 s plus one beat.
     */
    count?: number;

    /**
     * The rock's popping hits, in quarter beats from the first beat; one on
     * each beat's "and" when absent.
     */
    hits?: number[];

    /**
     * The most a member's timing strays from the beat, seconds, at least 0,
     * drawn per member from its seed; 0.02 when absent.
     */
    vary?: number;

    /** The moonwalk's first sliding foot; `right` when absent. */
    side?: AutoMovieHumanSide;

    /** A cue track to lock the beats to, as the dance law's. */
    lock?: IAutoMovieMotionHumanDance.IParams["lock"];
  }
}
