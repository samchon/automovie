import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * What an arm primitive is given: a hand surface's target, the origin the
 * hand leaves from and returns to, and the wrist goal the two make.
 *
 * The members are `AutoMovieMotionHumanArm`'s, which names them; they live
 * here so the carry, the move and the phrases read them without reading
 * each other.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the records are and why they have a file of their own.
 * @evidence contracts/development/design.md#principled-representation A target is a surface's place, facing and bend; an origin is a wrist's place and rotation; the goal is the posture's own goal type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The records and the three readers every arm primitive shares; `AutoMovieMotionHumanArm` re-exports each by name.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No primitive is defined here, so no file of the arm depends on another's phrases.
 */
export namespace AutoMovieMotionHumanArmTarget {
  /**
   * Where a hand surface goes and how the hand is held there, world frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is and its frame; each member gives its unit and its meaning when absent.
   * @evidence contracts/development/design.md#principled-representation The surface, its point and the hand's rotation fix the wrist; the bend hint fixes the elbow's one remaining freedom; the shape and the curl fix the fingers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, each read by `goal` or `move`; `curl` is optional because most shapes need none.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `HumanHand.Surface` and `HumanHand.Shape` and the interface's vector and quaternion types.
   */
  export interface ITarget {
    /** The surface brought to the point. */
    surface: HumanHand.Surface;

    /** The hand shape held at the target. */
    shape: HumanHand.Shape;

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
  export interface ISided extends ITarget {
    /** The arm. */
    side: HumanHand.Side;
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
  export type Frame = (posture: IHumanPosture, seconds: number) => ITarget;

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
    body: IHumanBody;

    /** The arm. */
    side: HumanHand.Side;

    /** Seconds since the action's start from which the arm is written. */
    from: number;

    /** Seconds since the action's start until which the arm is written. */
    to: number;

    /** Where the hand is at weight 0. */
    origin: IOrigin;

    /** Where the hand is at weight 1. */
    target: Frame;

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

  /**
   * Where a hand surface is on a pose, as an origin in a floor frame.
   *
   * @param body The body.
   * @param bones The pose's resolved bones.
   * @param frame The performer's floor frame at that pose.
   * @param side The hand.
   * @param surface The surface.
   * @returns The origin.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and that the result is in the given floor frame.
   * @evidence contracts/development/implementation.md#principled-implementation The surface's world point and the hand's world rotation, taken into the floor frame by its inverse: the hand's place relative to the body.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two inverse transforms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the relaxed hand, the shape an arm has before a movement shapes it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanHand.frame`, `HumanFrame.local` and `HumanFrame.turn`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function origin(
    body: IHumanBody,
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">
    >,
    frame: HumanFrame.IFrame,
    side: HumanHand.Side,
    surface: HumanHand.Surface,
  ): IOrigin {
    return {
      point: HumanFrame.local(
        frame,
        HumanHand.frame(body, bones, side, surface, "relaxed").point,
      ),
      rotation: Quaternion.multiply(
        HumanFrame.turn(-frame.yaw),
        bones.get(`${side}Hand`)!.worldRotation,
      ),
    };
  }

  /**
   * An origin's surface point in the world on a posture.
   *
   * @param posture The posture whose root and heading carry the origin.
   * @param from The origin.
   * @returns The world point, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what of the posture is read and the result's frame and unit.
   * @evidence contracts/development/implementation.md#principled-implementation The floor-frame transform of the origin's point by the posture's root and heading, the inverse of what `origin` stored.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The root's own height is kept, as `origin` measured from it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanFrame.point`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function point(
    posture: Pick<IHumanPosture, "root" | "yaw">,
    from: IOrigin,
  ): IAutoMovieVector3 {
    return HumanFrame.point(
      { origin: posture.root, yaw: posture.yaw },
      from.point,
    );
  }

  /**
   * The limb goal that puts a hand surface on its target: the wrist placed
   * for the asked rotation, and the surface declared as the goal's contact so
   * the resolver keeps it on the point when the rotation is out of range.
   *
   * @param body The body.
   * @param side The arm.
   * @param target The target.
   * @returns The goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the goal places and why it carries the surface as its contact.
   * @evidence contracts/development/implementation.md#principled-implementation The wrist follows rigidly from the surface's point and the hand's rotation; the surface's offset from the wrist is the contact the resolver holds when the rotation is out of range.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One wrist placement and one offset lookup.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A surface at the wrist itself declares no contact, since a zero offset gives the resolver no lever to re-aim by.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanHand.place` and `HumanHand.offset`, the owners of the hand's geometry.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function goal(
    body: IHumanBody,
    side: HumanHand.Side,
    target: Omit<ITarget, "curl">,
  ): IHumanPosture.IGoal {
    const wrist: HumanHand.IWrist = HumanHand.place(
      body,
      side,
      target.surface,
      target.point,
      target.rotation,
      target.shape,
    );
    const contact: IAutoMovieVector3 = HumanHand.offset(
      body,
      side,
      target.surface,
      target.shape,
    ).point;
    return {
      point: wrist.point,
      rotation: wrist.rotation,
      bend: target.bend,
      ...(Vector3.length(contact) < 1e-9 ? {} : { contact }),
    };
  }
}
