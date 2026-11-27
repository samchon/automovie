import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";

/**
 * Turn over while lying: between the back, either side and the front about the
 * body's long axis, on the floor or on a bed's surface.
 */
export interface IAutoMovieMotionHumanTurnOver {
  /** The lying position reached. */
  to: IAutoMovieMotionHumanTurnOver.Position;

  /**
   * The side a turn between the back and the front passes over; the left when
   * absent.
   */
  via?: AutoMovieHumanSide;

  /** The prop whose lying surface bears the body; the floor when absent. */
  on?: IAutoMovieMotionHumanTurnOver.IOn;

  /** How long the reached position is held, seconds; none when absent. */
  hold?: number;

  /** How the body turns. */
  manner?: IAutoMovieMotionManner;
}

/** Companion types of {@link IAutoMovieMotionHumanTurnOver}. */
export namespace IAutoMovieMotionHumanTurnOver {
  /** The lying positions. */
  export type Position = "supine" | "lateralLeft" | "prone" | "lateralRight";

  /** A lying surface on a prop. */
  export interface IOn {
    /** The bed or sofa prop. */
    prop: string;

    /** Its lying surface affordance; `surface` when absent. */
    surface?: string;
  }
}
