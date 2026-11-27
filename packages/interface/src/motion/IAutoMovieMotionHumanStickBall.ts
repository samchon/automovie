import type { IAutoMovieMotionTarget } from "./IAutoMovieMotionTarget";

/**
 * A two-hand sports-stick action layered on the authored standing or moving
 * support.
 */
export namespace IAutoMovieMotionHumanStickBall {
  /**
   * The actual working contact of the action. Field hockey pushes a sphere with
   * the blade, ice hockey pushes the puck at its radial rim, and the lacrosse
   * variants stage pocket acquisition and release.
   */
  export type Kind =
    | "fieldHockey"
    | "iceHockey"
    | "lacrosseScoop"
    | "lacrossePass";

  /** The timing, identity and intended direction of a stick action. */
  export interface IParams {
    /** The stick's role in the play. */
    kind: Kind;

    /** The stick subject, with a shaft grip and the selected working affordance. */
    stick: string;

    /** The acted-on ball or puck subject. */
    ball: string;

    /**
     * The destination direction, read from this target at contact. Defaults to
     * the performer's heading.
     */
    target?: IAutoMovieMotionTarget;

    /** The hand closer to the stick head. Defaults to right. */
    hand?: "left" | "right";

    /** Duration in seconds. Defaults to 0.75 s. */
    duration?: number;

    /** The release speed in m/s for a pass. The scoop retains the ball. */
    speed?: number;
  }
}
