import type { IAutoMovieMotionHumanSwimStroke } from "./IAutoMovieMotionHumanSwimStroke";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";

/**
 * Parameters for surface swimming, treading, floating and an authored falter on
 * one horizontal water plane. Append the action with
 * {@link IAutoMovieMotionHumanChainSport.swim}.
 */
export namespace IAutoMovieMotionHumanSwim {
  /** One surface action and its optional water level, timing and heading. */
  export interface IParams {
    /** The authored stroke or surface outcome. */
    kind: IAutoMovieMotionHumanSwim.Kind;

    /**
     * Water height in world metres. When omitted, use the entry root height
     * plus the body's chest height.
     */
    water?: number;

    /**
     * Number of cycles, a positive integer. The default is three. A `falter`
     * has one nonrepeating cycle and defaults to one.
     */
    count?: number;

    /**
     * Performance timing. A pace of 1.5 plays each cycle in two thirds of its
     * neutral time and preserves the course distance.
     */
    manner?: IAutoMovieMotionManner;

    /**
     * Heading change over the full dog-paddle course, in degrees relative to
     * the entry heading, from -90 to 90. Positive values turn toward the left.
     * Omit for a straight course. The other actions accept only zero.
     */
    turn?: number;
  }

  /**
   * Surface action. `dogPaddle` advances with alternating arm pulls and kicks.
   * `treadWater` stays in place upright. `falter` briefly loses its rhythm,
   * dips, and reaches a breathing cue in place. Follow it with an authored
   * recovery such as `float` or `treadWater`.
   */
  export type Kind =
    | "treadWater"
    | "frontCrawl"
    | "dogPaddle"
    | "falter"
    | IAutoMovieMotionHumanSwimStroke.Name;
}
