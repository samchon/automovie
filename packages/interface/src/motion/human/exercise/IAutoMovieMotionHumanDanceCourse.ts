import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionClockInstant } from "../compose/IAutoMovieMotionClockInstant";
import type { IAutoMovieMotionHumanArmTarget } from "../compose/IAutoMovieMotionHumanArmTarget";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanDanceFootKey } from "./IAutoMovieMotionHumanDanceFootKey";

/**
 * A keyed dance's whole course (`DanceFootwork.compose`): each foot's keys,
 * the hips' world path and heading, the joints above the hips, and the
 * named instants, over the action's seconds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each field.
 * @evidence contracts/development/design.md#principled-representation One record a keyed dance law hands the shared footwork.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Duration, keys, carriage, instants, and the optional hands and their holds.
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
   * @evidence contracts/development/common.md#meaningful-documentation Documents hips: The hips' world point.
   */
  hips(seconds: number): IAutoMovieVector3;

  /**
   * The heading.
   *
   * @param seconds Action seconds.
   * @returns Degrees about +Y.
   * @evidence contracts/development/common.md#meaningful-documentation Documents yaw: The heading.
   */
  yaw(seconds: number): number;

  /**
   * The joints above the hips.
   *
   * @param seconds Action seconds.
   * @returns Clinical angles.
   * @evidence contracts/development/common.md#meaningful-documentation Documents joints: The joints above the hips.
   */
  joints(seconds: number): IAutoMovieMotionHumanPosture["joints"];

  /** The named instants, action seconds. */
  instants: IAutoMovieMotionClockInstant[];

  /**
   * Where the hands are held, for a dance whose hands join another's or rest
   * on them; the joints' arms when absent.
   *
   * @param seconds Action seconds.
   * @returns Each placed hand's target.
   * @evidence contracts/development/common.md#meaningful-documentation Documents member: Where the hands are held, for a dance whose hands join another's or rest on them; the joints' arms when absent.
   */
  hands?(seconds: number): IAutoMovieMotionHumanDanceCourse.IHands;

  /** The hands' contacts with partners, shares of the duration. */
  holds?: IAutoMovieMotionHumanDanceCourse.IHold[];
}
export namespace IAutoMovieMotionHumanDanceCourse {
  /**
   * The placed hands; a hand absent keeps the joints' arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IHands: The placed hands; a hand absent keeps the joints' arm.
   */
  export interface IHands {
    /** The left hand's target. */
    left?: IAutoMovieMotionHumanArmTarget.ITarget;

    /** The right hand's target. */
    right?: IAutoMovieMotionHumanArmTarget.ITarget;
  }

  /**
   * One hand held on a partner over a span.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents IHold: One hand held on a partner over a span.
   */
  export interface IHold {
    /** Which hand. */
    side: AutoMovieHumanSide;

    /** The partner's scene id. */
    subject: string;

    /** The partner's bone the hand holds. */
    bone: AutoMovieHumanoidBone;

    /** Start share. */
    from: number;

    /** End share. */
    to: number;
  }
}
