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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the argument's timebase and the result's frame and unit.
   * @evidence contracts/development/implementation.md#principled-implementation The hips' path is a function of action seconds in world metres, which DanceFootwork samples at the instants it composes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Each keyed dance law owns its hips' path; the shared footwork only samples it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The signature admits no fixture or scene input, only the action's seconds.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: each keyed dance law supplies the body and answers for its cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: each keyed dance law supplies the body and decides what it shares.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: each keyed dance law supplies the body and owns what it retains.
   */
  hips(seconds: number): IAutoMovieVector3;

  /**
   * The heading.
   *
   * @param seconds Action seconds.
   * @returns Degrees about +Y.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the argument's timebase and the result's axis and unit.
   * @evidence contracts/development/implementation.md#principled-implementation The heading is a function of action seconds in degrees about world +Y, which DanceFootwork samples at the instants it composes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Each keyed dance law owns its heading; the shared footwork only samples it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The signature admits no fixture or scene input, only the action's seconds.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: each keyed dance law supplies the body and answers for its cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: each keyed dance law supplies the body and decides what it shares.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: each keyed dance law supplies the body and owns what it retains.
   */
  yaw(seconds: number): number;

  /**
   * The joints above the hips.
   *
   * @param seconds Action seconds.
   * @returns Clinical angles.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the argument's timebase and that the result is the posture's clinical joint angles.
   * @evidence contracts/development/implementation.md#principled-implementation The carriage above the hips is a function of action seconds in the posture's clinical angles, which DanceFootwork samples at the instants it composes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Each keyed dance law owns its carriage; the shared footwork only samples it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The signature admits no fixture or scene input, only the action's seconds.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: each keyed dance law supplies the body and answers for its cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: each keyed dance law supplies the body and decides what it shares.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: each keyed dance law supplies the body and owns what it retains.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States when a dance supplies it, the argument's timebase, the result and the default when absent.
   * @evidence contracts/development/implementation.md#principled-implementation The placed hands are a function of action seconds, so a dance whose hands join or rest on a partner's can follow the partner over the course.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Each keyed dance law that joins hands owns their targets; the shared footwork reaches them and otherwise keeps the joints' arms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The signature admits no fixture or scene input, only the action's seconds.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: each keyed dance law supplies the body and answers for its cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: each keyed dance law supplies the body and decides what it shares.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: each keyed dance law supplies the body and owns what it retains.
   */
  hands?(seconds: number): IAutoMovieMotionHumanDanceCourse.IHands;

  /** The hands' contacts with partners, shares of the duration. */
  holds?: IAutoMovieMotionHumanDanceCourse.IHold[];
}
export namespace IAutoMovieMotionHumanDanceCourse {
  /**
   * The placed hands; a hand absent keeps the joints' arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each hand's target and what an absent hand keeps.
   * @evidence contracts/development/design.md#principled-representation One optional arm target per side, in the arm target's own frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, returned by a keyed dance's `hands` and reached by the shared footwork.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Each side is independent, so any combination of placed hands is meaningful.
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
   * @evidence contracts/development/common.md#meaningful-documentation States the hand, the partner, the held bone and the span as shares of the duration.
   * @evidence contracts/development/design.md#principled-representation The span is two shares of the action's duration; the partner is a scene id and the held part a humanoid bone.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members a keyed dance law lists in the course's `holds` to record the hand's contact with a partner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The order of `from` and `to` within [0, 1] is not encoded in the type and remains for the producing law.
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
