import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Log-roll across the floor (#3987): the lying body, straight with the arms
 * overhead, rolls about its long axis toward one side, for a number of half
 * turns or to a named place, ending on the back or the front: a dodge on
 * the ground, or the stop, drop and roll of #3976.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the movement and every member's meaning.
 * @evidence contracts/development/design.md#principled-representation The side rolled toward, and either a count of half turns or a floor point to reach.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The side, the count or place, the end position and the manner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Both or neither of a count and a place, and an entry not lying, are refused at runtime.
 */
export interface IAutoMovieMotionHumanLogRoll {
  /** The side of the body rolled toward. */
  toward: AutoMovieHumanSide;

  /** How many half turns are rolled. */
  halfTurns?: number;

  /** The floor point the pelvis rolls to, along the side rolled toward. */
  to?: IAutoMovieVector3;

  /** The position the roll ends in, which a place rounds its half turns to; whichever the count reaches when absent. */
  end?: IAutoMovieMotionHumanLogRoll.End;

  /** How fast the body rolls. */
  manner?: IAutoMovieMotionManner;
}

/**
 * Companion types of {@link IAutoMovieMotionHumanLogRoll}.
 */
export namespace IAutoMovieMotionHumanLogRoll {
  /** The positions a log roll ends in. */
  export type End = "supine" | "prone";
}
