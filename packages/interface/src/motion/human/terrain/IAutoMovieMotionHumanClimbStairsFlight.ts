import type { IAutoMovieMotionHumanFrame } from "../posture/IAutoMovieMotionHumanFrame";

/**
 * The flight of stairs a climb is planned on: its shape as the author gives it,
 * the flight resolved in the performer's starting floor frame, and the surface
 * height under a point. Read by the climb's plan (`climbStairs`) and by the
 * capture that checks soles against the treads.
 */
export namespace IAutoMovieMotionHumanClimbStairsFlight {
  /** The stairs as an author describes them. */
  export interface IStairs {
    /** How many treads. */
    count: number;

    /** Each riser's height, metres; 0.17 when absent. */
    riser?: number;

    /** Each tread's depth, metres; 0.28 when absent. */
    tread?: number;

    /** Up the flight or down it; `up` when absent. */
    direction?: "up" | "down";

    /** The first nosing's distance ahead of the toes, metres; 0.05 when absent. */
    start?: number;
  }

  /** A flight as the plan resolved it. */
  export interface IFlight {
    /** The frame: origin on the floor under the feet's middle, the heading. */
    frame: IAutoMovieMotionHumanFrame;

    /** The first nosing's distance ahead in that frame, metres. */
    first: number;

    /** Treads. */
    count: number;

    /** Riser, metres. */
    riser: number;

    /** Tread, metres. */
    tread: number;

    /** Up or down. */
    direction: "up" | "down";
  }
}
