import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";

/**
 * A kinematic beat for a performer carrying a digital stage prop. The law reads
 * the held prop's local marks and places a visible pose on a cue. Performer
 * reactions are independent authored actions.
 */
export interface IAutoMovieMotionHumanStageProp {
  /** Look of the stage beat. */
  beat:
    | "figureEight"
    | "overheadCircle"
    | "block"
    | "yield"
    | "boss"
    | "rim"
    | "offset"
    | "linked";

  /** Scene id of the digital prop the performer already holds. */
  prop: string;

  /** Main holding hand. Right when absent. */
  hand?: AutoMovieHumanSide;

  /** Prop-local mark id. Uses the selected beat's mark when absent. */
  mark?: string;

  /** Grip site id for the other hand as a support on the same prop. */
  support?: string;

  /**
   * Optional point in the virtual set, in world metres, for the visible accent
   * with the stance planted.
   */
  at?: IAutoMovieVector3;

  /** Staged time, seconds, positive; the beat's authored time when absent. */
  duration?: number;
}
