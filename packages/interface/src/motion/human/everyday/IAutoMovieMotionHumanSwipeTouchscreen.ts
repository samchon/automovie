import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * A one-finger swipe along the local X axis of a stationary screen at the
 * center of its depth. The motion law admits the fixture, screen and path.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixture and screen, endpoint frame and bounds, active hand and touch duration.
 * @evidence contracts/development/design.md#principled-representation The screen binds the gesture to a prop affordance, with centered shares and film seconds for the path and timing.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The action reads only the named screen, path endpoints, hand and contact duration.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the shared hand-side vocabulary and the frame and width authored on the screen affordance.
 */
export interface IAutoMovieMotionHumanSwipeTouchscreen {
  /** The stationary fixture's prop subject id. */
  prop: string;

  /** The unit-scale `surface` affordance id. Its +Y faces out and its width runs along +X. */
  screen: string;

  /** The touch-in position along the screen's width, as a share in [-0.5, 0.5] from its center. */
  from: number;

  /** The distinct touch-out position, in the same frame and range as `from`. */
  to: number;

  /** The active hand, right when omitted. */
  hand?: AutoMovieHumanSide;

  /** Positive nominal seconds of screen contact. Defaults to the measured mean swipe duration. */
  seconds?: number;
}
