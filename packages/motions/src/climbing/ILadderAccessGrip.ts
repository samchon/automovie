import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A ladder grip of the access route: the published contact window and the point
 * on the rung or rail the hand holds through it.
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
