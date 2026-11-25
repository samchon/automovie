import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanDance } from "../next/IAutoMovieMotionHumanDance";

/**
 * Social group dances on one shared beat, each member dancing the same steps
 * relative to the group:
 *
 * - Line: a grapevine to the right and back to the left, the last count turning a
 *   quarter to the left, so every repeat faces the next wall and the rows keep
 *   their spacing;
 * - Circle: members spaced evenly round a centre, hands joined with their
 *   neighbours, side-stepping round the centre so the circle rotates;
 * - Conga: members in file, each with both hands on the shoulders of the one
 *   ahead, stepping three counts forward and kicking on the fourth.
 *
 * Each member's timing strays from the beat within `vary`, drawn from its own
 * seed, so a crowd does not dance cloned.
 */
export namespace IAutoMovieMotionHumanGroupDance {
  /** The dances. */
  export type Kind = "line" | "circle" | "conga";

  /** Parameters. */
  export interface IParams {
    /** The dance. */
    kind: Kind;

    /** Beats per minute, positive; the dance law's `BPM` when absent. */
    bpm?: number;

    /**
     * How many times the eight-count pattern is danced, a whole number of at
     * least 1; 1 when absent.
     */
    repeats?: number;

    /** A circle's centre on the floor, world metres. */
    centre?: IAutoMovieVector3;

    /**
     * How many dance in the circle, a whole number of at least 3, so each
     * member knows its neighbours.
     */
    members?: number;

    /**
     * A circle member's neighbour on the left, whose right hand this one's left
     * hand joins; open when absent.
     */
    left?: string;

    /**
     * A circle member's neighbour on the right, whose left hand this one's
     * right hand joins; open when absent.
     */
    right?: string;

    /**
     * The conga member ahead, whose shoulders this one holds; the head of the
     * line when absent.
     */
    ahead?: string;

    /**
     * The most a member's timing strays from the beat, seconds, at least 0,
     * drawn from its seed; 0.02 when absent.
     */
    vary?: number;

    /** A cue track to lock the beats to, as the dance law's. */
    lock?: IAutoMovieMotionHumanDance.IParams["lock"];
  }
}
