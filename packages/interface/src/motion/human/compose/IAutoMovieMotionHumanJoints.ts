import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { AutoMovieMotionHumanChannel } from "./AutoMovieMotionHumanChannel";

/**
 * Joint primitives: clinical angles written on the joints of a channel
 * directly, for the parts no effector goal places (the head's nod, the
 * shoulder girdle's shrug, the spine's slump).
 *
 * @evidence contracts/development/common.md#meaningful-documentation from: Seconds since the action's start from which the angles are added. to: Seconds since the action's start until which the angles are added.
 * @evidence contracts/development/design.md#principled-representation from: Seconds since the action's start from which the angles are added. to: Seconds since the action's start until which the angles are added.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanHead.ts (AutoMovieMotionHumanHead.share, return); compose/AutoMovieMotionHumanHead.ts (AutoMovieMotionHumanHead.oscillate, return); compose/AutoMovieMotionHumanJoints.ts (AutoMovieMotionHumanJoints.channels, angles); compose/AutoMovieMotionHumanJoints.ts (AutoMovieMotionHumanJoints.pulse, peak); compose/AutoMovieMotionHumanJoints.ts (AutoMovieMotionHumanJoints.pulse, return); daily/handToFace.ts (handToFace.plan.turned, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone, AutoMovieMotionHumanChannel identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanJoints {
  /**
   * Clinical `[flexion, abduction, twist]` degrees by bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the triple's order and unit and the key.
   * @evidence contracts/development/design.md#principled-representation The posture's own joint form, so added angles and held angles sum member by member.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One alias, used by every function here.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Keyed by `AutoMovieHumanoidBone`, not by string.
   */
  export type Angles = Partial<
    Record<AutoMovieHumanoidBone, readonly [number, number, number]>
  >;

  /**
   * Angles added over a window.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit, and which bones the angles may name.
   * @evidence contracts/development/design.md#principled-representation The channels claimed, the span written and the angles added at each second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read by `add`; `pulse` fills them from a clock.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The channels are stated and checked against the bones at each second instead of being trusted.
   */
  export interface IAdd {
    /** The channels whose joints are written. */
    channels: readonly AutoMovieMotionHumanChannel[];

    /** Seconds since the action's start from which the angles are added. */
    from: number;

    /** Seconds since the action's start until which the angles are added. */
    to: number;

    /**
     * The angles added to what the posture holds.
     *
     * @param seconds Seconds since the action's start.
     * @returns Degrees by bone; every bone belongs to one of the channels.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument and its origin, the unit and the bones the result may name.
     * @evidence contracts/development/implementation.md#principled-implementation The angles are a pure function of the seconds, so any time course fits one member and `add` evaluates it at each second it writes.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by `add`; `pulse` fills it from a clock.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `add` checks the named bones against the claimed channels at each second, so an implementation cannot write a bone it did not claim.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    delta(seconds: number): IAutoMovieMotionHumanJoints.Angles;
  }
}
