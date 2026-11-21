import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionClockInstant } from "../compose/IAutoMovieMotionClockInstant";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanDanceFootKey } from "./IAutoMovieMotionHumanDanceFootKey";

/**
 * A keyed dance's whole course (`DanceFootwork.compose`): each foot's keys,
 * the hips' world path and heading, the joints above the hips, and the
 * named instants, over the action's seconds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each field.
 * @evidence contracts/development/design.md#principled-representation One record a keyed dance law hands the shared footwork.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Duration, keys, carriage and instants.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Seconds are the action's own; points are world metres.
 */
export interface IAutoMovieMotionHumanDanceCourse {
  /** The action's seconds. */
  duration: number;

  /** The left foot's keys in time order. */
  left: IAutoMovieMotionHumanDanceFootKey[];

  /** The right foot's keys in time order. */
  right: IAutoMovieMotionHumanDanceFootKey[];

  /**
   * The hips' world point.
   *
   * @param seconds Action seconds.
   * @returns World metres.
   */
  hips(seconds: number): IAutoMovieVector3;

  /**
   * The heading.
   *
   * @param seconds Action seconds.
   * @returns Degrees about +Y.
   */
  yaw(seconds: number): number;

  /**
   * The joints above the hips.
   *
   * @param seconds Action seconds.
   * @returns Clinical angles.
   */
  joints(seconds: number): IAutoMovieMotionHumanPosture["joints"];

  /** The named instants, action seconds. */
  instants: IAutoMovieMotionClockInstant[];
}
