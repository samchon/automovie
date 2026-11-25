import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A one-finger swipe along the local X axis of a stationary screen at the
 * center of its depth. The motion law admits the fixture, screen and path.
 */
export interface IAutoMovieMotionHumanSwipeTouchscreen {
  /** The stationary fixture's prop subject id. */
  prop: string;

  /**
   * The unit-scale `surface` affordance id. Its +Y faces out and its width runs
   * along +X.
   */
  screen: string;

  /**
   * The touch-in position along the screen's width, as a share in [-0.5, 0.5]
   * from its center.
   */
  from: number;

  /** The distinct touch-out position, in the same frame and range as `from`. */
  to: number;

  /** The free hand facing the screen, right when omitted. */
  hand?: AutoMovieHumanSide;

  /**
   * Positive nominal seconds of contact with distinct clock endpoints. Defaults
   * to the measured mean swipe duration.
   */
  duration?: number;
}
