import type { IAutoMovieMotionHumanFrame } from "../posture/IAutoMovieMotionHumanFrame";

/**
 * The flight of stairs a climb is planned on: its shape as the author gives
 * it, the flight resolved in the performer's starting floor frame, and the
 * surface height under a point. Read by the climb's plan (`climbStairs`) and
 * by the capture that checks soles against the treads.
 *
 * @evidence contracts/development/common.md#meaningful-documentation riser: Each riser's height, metres; 0.17 when absent. tread: Each tread's depth, metres; 0.28 when absent. direction: Up the flight or down it; `up` when absent.
 * @evidence contracts/development/design.md#principled-representation riser: Each riser's height, metres; 0.17 when absent. tread: Each tread's depth, metres; 0.28 when absent. direction: Up the flight or down it; `up` when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: executable/cases/stairsCases.ts (boxes, flight); terrain/climbStairsFlight.ts (climbStairsFlight.surface, flight); terrain/climbStairsFlight.ts (climbStairsFlight.flight, return); terrain/climbStairsFlight.ts (climbStairsFlight.flight, params); executable/cases/stairsCases.ts (stairsCases); terrain/climbStairs.ts (climbStairs.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanFrame identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanClimbStairsFlight {
  /**
   * The stairs as an author describes them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and default.
   * @evidence contracts/development/design.md#principled-representation The flight's architecture.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, all read by `flight`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain numbers and one closed union.
   */
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

  /**
   * A flight as the plan resolved it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The flight in the performer's starting floor frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `surface` and the capture.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain numbers.
   */
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
