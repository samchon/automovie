import type {
  IAutoMovieMotionHumanBallPlay,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Where a receiver stands to take a launched ball, from ballStation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each field states its unit and frame.
 * @evidence contracts/development/design.md#principled-representation Floor position in world metres, facing in degrees, the intercept in seconds after the launch and the crossing it came from.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What a staged catch reads in the sport play tests.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the play's crossing record.
 */
export interface IBallStation {
  /** Floor position, world metres. */
  at: IAutoMovieVector3;

  /** Facing, degrees about +Y from +Z. */
  yaw: number;

  /** Seconds after the launch at which the ball crosses the plane. */
  intercept: number;

  /** The crossing itself. */
  crossing: IAutoMovieMotionHumanBallPlay.ICrossing;
}
