import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanBalance } from "../law/IAutoMovieMotionHumanBalance";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";

/**
 * Trunk lean primitives: the whole body above the feet tipped about the
 * hips, with the hips moved back so the centre of mass stays over the feet.
 *
 * A standing person who tips the trunk forward moves the hips back by the
 * same movement, or falls forward (the counter-movement of a bow, a reach to
 * the floor, a look under a table). The planted legs keep their goals and are
 * solved again when the posture is resolved.
 *
 * @evidence contracts/development/common.md#meaningful-documentation peak: The deepest forward pitch, degrees; positive. from: Seconds since the action's start from which the trunk is written. to: Seconds since the action's start until which the trunk is written.
 * @evidence contracts/development/design.md#principled-representation peak: The deepest forward pitch, degrees; positive. from: Seconds since the action's start from which the trunk is written. to: Seconds since the action's start until which the trunk is written.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanLean.ts (AutoMovieMotionHumanLean.tilt, props); compose/AutoMovieMotionHumanLean.ts (AutoMovieMotionHumanLean.pivot, more); exercise/dance.ts (dance.plan, return); reaction/flinch.ts (flinch.plan, return); reaction/give.ts (give.plan.primitive, return); reaction/knockdown.ts (knockdown.plan, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanLean {
  /**
   * A lean over a window.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, its unit, its sign and the range of the weight.
   * @evidence contracts/development/design.md#principled-representation The deepest pitch, the posture the balance is solved on, the span written and the share of the pitch held.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, all read by `bow`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The hip shift is not a member: it follows from the body and the peak.
   */
  export interface IBow {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** A standing posture of the action, the one the balance is solved on. */
    standing: IAutoMovieMotionHumanPosture;

    /** The deepest forward pitch, degrees; positive. */
    peak: number;

    /** The physical terms asked (`IAutoMovieMotionHumanBalance`): absent, the hips are not shifted back and no centre of mass is read. */
    balance?: IAutoMovieMotionHumanBalance;

    /** Seconds since the action's start from which the trunk is written. */
    from: number;

    /** Seconds since the action's start until which the trunk is written. */
    to: number;

    /**
     * How much of the peak pitch the trunk holds.
     *
     * @param seconds Seconds since the action's start.
     * @returns A value in [0, 1].
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument and its origin, and that the result is a share in [0, 1].
     * @evidence contracts/development/implementation.md#principled-implementation The share is a pure function of the seconds, so any time course fits one member and the reader evaluates it at each second it needs.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by the function that writes the part; the builders from a clock fill it.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The reader clamps the result to [0, 1] instead of trusting the member, so an implementation that overshoots cannot push the part past its ends.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    weight(seconds: number): number;
  }

  /**
   * A tilt of the whole body about the root, degrees added to the posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is tilted, about what, and each member's unit.
   * @evidence contracts/development/design.md#principled-representation The two angles the trunk channel owns besides its joints.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, returned by a tilt's `angles`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both members required and named, instead of a positional pair.
   */
  export interface IAngles {
    /** Forward pitch added, degrees. */
    pitch: number;

    /** Roll added, degrees. */
    roll: number;
  }

  /**
   * A tilt over a window.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The span the trunk is written over and the tilt added at each second.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, all read by `tilt`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The tilt is a function of seconds and not a peak with a named easing.
   */
  export interface ITilt {
    /** Seconds since the action's start from which the trunk is written. */
    from: number;

    /** Seconds since the action's start until which the trunk is written. */
    to: number;

    /**
     * The tilt added to what the posture holds.
     *
     * @param seconds Seconds since the action's start.
     * @returns The pitch and the roll, degrees.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument and its origin, the unit and that the pitch and the roll are added to the posture.
     * @evidence contracts/development/implementation.md#principled-implementation The pitch and the roll are a pure function of the seconds, so any time course of a tilt fits one member.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by `tilt`.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tilt is stated as two angles per second and not as a peak with a named easing, so no case of one easing is built in.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    angles(seconds: number): IAutoMovieMotionHumanLean.IAngles;
  }

  /**
   * A sway over a window.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, its frame and its unit, and what an absent member means.
   * @evidence contracts/development/design.md#principled-representation The span written, the tilt about the hips, the hips' travel over the floor and the leg goals the hips' height is solved against.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, all read by `sway`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The hips' height is not a member: it follows from the legs.
   */
  export interface ISway {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** Seconds since the action's start from which the root and the trunk are written. */
    from: number;

    /** Seconds since the action's start until which the root and the trunk are written. */
    to: number;

    /**
     * The tilt about the hips added to what the posture holds.
     *
     * @param seconds Seconds since the action's start.
     * @returns The pitch and the roll, degrees.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument and its origin, the unit and that the angles are added to the posture.
     * @evidence contracts/development/implementation.md#principled-implementation The pitch and the roll are a pure function of the seconds, so any time course of a sway fits one member.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by `sway`.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tilt is stated as two angles per second and not as a peak with a named easing.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    angles(seconds: number): IAutoMovieMotionHumanLean.IAngles;

    /**
     * The hips' travel over the floor from where the posture holds them;
     * none when absent.
     *
     * @param seconds Seconds since the action's start.
     * @returns Metres in the performer's floor frame: `x` left, `z` forward; `y` is not read.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument, the frame, the unit and the component that is not read.
     * @evidence contracts/development/implementation.md#principled-implementation The travel is a pure function of the seconds in the frame the root primitives use, so a sway composes with a root that already moves.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by `sway`.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The height is never taken from the member, since the legs decide it.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    shift?(seconds: number): IAutoMovieVector3;

    /**
     * The leg goals the hips' height is solved against; the posture's own
     * leg goals when absent.
     *
     * @param seconds Seconds since the action's start.
     * @returns The two leg goals at that second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the argument, the result and what an absent member reads.
     * @evidence contracts/development/implementation.md#principled-implementation The root is written before the legs, so an action whose own rows move the feet states where they are at each second.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One member read once per evaluated second by `sway`.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The goals are only read for the height and never written, so the leg rows stay the owners of the legs.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A declared member has no body, so it has no algorithm; the cost belongs to each implementation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A declared member coordinates no work, so it shares none.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A declared member owns no state; what an implementation retains is stated by the function that builds it.
     */
    legs?(
      seconds: number,
    ): Pick<IAutoMovieMotionHumanPosture["limbs"], "leftLeg" | "rightLeg">;
  }
}
