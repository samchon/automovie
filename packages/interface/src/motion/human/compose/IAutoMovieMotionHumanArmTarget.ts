import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * Arm primitives: a hand surface carried to a target, kept on it and taken
 * back.
 *
 * A target is a frame evaluated at each second on the posture the action has
 * so far (a region of the performer's own trunk, a partner's hand, a prop, a
 * point of the world), so the same row fits every body and follows whatever
 * the target rides on. The hand is an effector goal solved by the arm's
 * inverse kinematics: the goal carries the surface as its contact, so where
 * the arm cannot turn the hand as asked the resolver re-aims the wrist until
 * the surface stays on its point and the rotation gives way
 * (`IAutoMovieMotionHumanPosture.IGoal.contact`).
 *
 * Between its origin and its target the surface moves on a straight path,
 * or one that bows to the arm's own side when the movement states a
 * curvature, and the hand turns by spherical interpolation, both by one
 * weight, and the
 * fingers go from the relaxed cascade to the target's shape by the same
 * weight (Jeannerod 1984: the hand is shaped during its transport). The
 * origin is held in the performer's own floor frame, so it follows the body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation point: Where the surface goes, world metres. bend: The elbow's bend hint, world metres. curl: Extra flexion of every finger joint over the shape, degrees; 0 when absent.
 * @evidence contracts/development/design.md#principled-representation point: Where the surface goes, world metres. bend: The elbow's bend hint, world metres. curl: Extra flexion of every finger joint over the shape, degrees; 0 when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanArmMove.ts (AutoMovieMotionHumanArmMove.reach, from); compose/AutoMovieMotionHumanArmMove.ts (AutoMovieMotionHumanArmMove.retract, to); compose/AutoMovieMotionHumanArmTarget.ts (AutoMovieMotionHumanArmTarget.origin, return); compose/AutoMovieMotionHumanArmTarget.ts (AutoMovieMotionHumanArmTarget.point, from); affordance/operate.ts (operate.plan.target, return); affordance/operateInsert.ts (operateInsert.target, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanHand.Surface, IAutoMovieMotionHumanHand.Shape, IAutoMovieVector3, IAutoMovieQuaternion, IAutoMovieMotionHumanHand.Side, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanArmTarget {
  /**
   * Where a hand surface goes and how the hand is held there, world frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is and its frame; each member gives its unit and its meaning when absent.
   * @evidence contracts/development/design.md#principled-representation The surface, its point and the hand's rotation fix the wrist; the bend hint fixes the elbow's one remaining freedom; the shape and the curl fix the fingers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, each read by `goal` or `move`; `curl` is optional because most shapes need none.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `IAutoMovieMotionHumanHand.Surface` and `IAutoMovieMotionHumanHand.Shape` and the interface's vector and quaternion types.
   */
  export interface ITarget {
    /** The surface brought to the point. */
    surface: IAutoMovieMotionHumanHand.Surface;

    /** The hand shape held at the target. */
    shape: IAutoMovieMotionHumanHand.Shape;

    /** Where the surface goes, world metres. */
    point: IAutoMovieVector3;

    /** The hand's asked world rotation from its rest. */
    rotation: IAutoMovieQuaternion;

    /** The elbow's bend hint, world metres. */
    bend: IAutoMovieVector3;

    /** Extra flexion of every finger joint over the shape, degrees; 0 when absent. */
    curl?: number;
  }

  /**
   * A target with the arm that takes it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record adds to a target.
   * @evidence contracts/development/design.md#principled-representation A target is the same for either hand; which arm takes it is a separate fact, added by extension.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One added member; the one record every law that places hands by a list reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Extends `ITarget` instead of repeating its members.
   */
  export interface ISided extends IAutoMovieMotionHumanArmTarget.ITarget {
    /** The arm. */
    side: IAutoMovieMotionHumanHand.Side;
  }

  /**
   * A target as a frame of the action.
   *
   * @param posture The posture so far at this second.
   * @param seconds Seconds since the action's start.
   * @returns The target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each argument is and when the function is called.
   * @evidence contracts/development/design.md#principled-representation A target that rides on something (the performer's trunk, a partner, a prop) is a function of the posture so far and the time, evaluated when the row is written.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One function type, taken by every arm primitive.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A fixed target is the constant function, so there is no second form for it.
   */
  export type Frame = (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ) => IAutoMovieMotionHumanArmTarget.ITarget;

  /**
   * Where a hand is before or after its movement, in the performer's floor
   * frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is and its frame; each member gives its axes and unit.
   * @evidence contracts/development/design.md#principled-representation A hand that has not started or has finished belongs to the body, so its place is held relative to the root and the heading and travels with them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, the surface's point and the hand's rotation; produced by `origin` and read by `move`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A separate type from `ITarget`, whose members are in the world frame, so the two frames cannot be mixed.
   */
  export interface IOrigin {
    /** The surface's point; `x` left, `y` up, `z` forward of the root, metres. */
    point: IAutoMovieVector3;

    /** The hand's rotation from its rest, relative to the heading. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * One arm's movement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, its unit and the range of the weight.
   * @evidence contracts/development/design.md#principled-representation The span the arm is written over, its two ends and the weight between them: a blend of two hand states on a time course.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Eight members, all read by `move`, the optional `curvature` among them (a straight path when absent); `reach`, `hold` and `retract` fill them from a clock.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The weight is a function of seconds and not a named easing, so any time course fits without a new member.
   */
  export interface IMove {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The arm. */
    side: IAutoMovieMotionHumanHand.Side;

    /** Seconds since the action's start from which the arm is written. */
    from: number;

    /** Seconds since the action's start until which the arm is written. */
    to: number;

    /** Where the hand is at weight 0. */
    origin: IAutoMovieMotionHumanArmTarget.IOrigin;

    /** Where the hand is at weight 1. */
    target: IAutoMovieMotionHumanArmTarget.Frame;

    /**
     * How far the hand is from its origin to its target.
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

    /**
     * How far the path between the origin and the target bows out to the
     * arm's own side at its middle, a share of the path's length; 0 when
     * absent, a straight path.
     */
    curvature?: number;
  }
}
