import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Log-roll across the floor: the lying body, straight with the arms overhead,
 * rolls about its long axis toward one side, for a number of half turns or to a
 * named place, ending on the back or the front: a dodge on the ground, or the
 * stop, drop and roll of `stopDropRoll`.
 */
export interface IAutoMovieMotionHumanLogRoll {
  /** The side of the body rolled toward. */
  toward: AutoMovieHumanSide;

  /** How many half turns are rolled. */
  halfTurns?: number;

  /** The floor point the pelvis rolls to, along the side rolled toward. */
  to?: IAutoMovieVector3;

  /**
   * The position the roll ends in, which a place rounds its half turns to;
   * whichever the count reaches when absent.
   */
  end?: IAutoMovieMotionHumanLogRoll.End;

  /** How fast the body rolls. */
  manner?: IAutoMovieMotionManner;
}

/** Companion types of {@link IAutoMovieMotionHumanLogRoll}. */
export namespace IAutoMovieMotionHumanLogRoll {
  /** The positions a log roll ends in. */
  export type End = "supine" | "prone";
}
