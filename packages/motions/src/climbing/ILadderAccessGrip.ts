import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A ladder grip of the access route: the published contact window and the
 * point on the rung or rail the hand holds through it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each member, its frame and units.
 * @evidence contracts/development/design.md#principled-representation The support law's own window with the staged world point it was fitted to.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planLadderAccess collects them and seatLadderAccessGrips seats the hands by them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The point is the staged target, never a re-derived placement.
 */
export interface ILadderAccessGrip {
  /** The gripping hand. */
  side: AutoMovieHumanSide;

  /** The held point on the rung's or rail's axis, world metres. */
  point: IAutoMovieVector3;

  /** Whether the held bar is an upright side rail rather than a rung. */
  rail: boolean;

  /** The window over which the support plan keeps this grip. */
  window: IAutoMovieMotionHumanContactWindow;
}
