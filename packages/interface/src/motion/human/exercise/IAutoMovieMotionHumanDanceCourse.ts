import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionClockInstant } from "../compose/IAutoMovieMotionClockInstant";
import type { IAutoMovieMotionHumanArmTarget } from "../compose/IAutoMovieMotionHumanArmTarget";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanDanceFootKey } from "./IAutoMovieMotionHumanDanceFootKey";

/**
 * A keyed dance's whole course (`DanceFootwork.compose`): each foot's keys, the
 * hips' world path and heading, the joints above the hips, and the named
 * instants, over the action's seconds.
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

  /**
   * Where the hands are held, for a dance whose hands join another's or rest on
   * them; the joints' arms when absent.
   *
   * @param seconds Action seconds.
   * @returns Each placed hand's target.
   */
  hands?(seconds: number): IAutoMovieMotionHumanDanceCourse.IHands;

  /** The hands' contacts with partners, shares of the duration. */
  holds?: IAutoMovieMotionHumanDanceCourse.IHold[];
}
export namespace IAutoMovieMotionHumanDanceCourse {
  /** The placed hands; a hand absent keeps the joints' arm. */
  export interface IHands {
    /** The left hand's target. */
    left?: IAutoMovieMotionHumanArmTarget.ITarget;

    /** The right hand's target. */
    right?: IAutoMovieMotionHumanArmTarget.ITarget;
  }

  /** One hand held on a partner over a span. */
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
