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
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanHand } from "./AutoMovieMotionHumanHand";
import type { AutoMovieMotionManner } from "./AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

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
 * (`IHumanPosture.IGoal.contact`).
 *
 * Between its origin and its target the surface moves on a straight path and
 * the hand turns by spherical interpolation, both by one weight, and the
 * fingers go from the relaxed cascade to the target's shape by the same
 * weight (Jeannerod 1984: the hand is shaped during its transport). The
 * origin is held in the performer's own floor frame, so it follows the body.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a target is and when it is evaluated, how the hand is solved, the path and the turn between origin and target, and the frame an origin is held in.
 * @evidence contracts/development/design.md#principled-representation An arm movement is an effector goal blended between a body-carried origin and a per-second target frame by one weight, the form reach-to-grasp studies describe (transport and hand shaping on one time course).
 * @evidence contracts/development/design.md#minimal-and-owned-surface One movement (`move`) with three named weights over it (`reach`, `hold`, `retract`) and the three conversions they need; the only owner of arm goals built from a hand surface.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the hand's surface and shape unions and the posture's goal type; no action name and no fixed body size appears.
 */
export namespace AutoMovieMotionHumanArm {
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
  export type Frame =(posture: IHumanPosture, seconds: number) => ITarget;

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
   * @evidence contracts/development/design.md#minimal-and-owned-surface Seven members, all read by `move`; `reach`, `hold` and `retract` fill them from a clock.
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

  /**
   * An arm moved between an origin and a target by a weight.
   *
   * @param props The movement.
   * @returns The primitive, on the arm's and the hand's channels.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what moves, by what, and the channels claimed.
   * @evidence contracts/development/implementation.md#principled-implementation A straight path of the surface and a spherical interpolation of the hand by one weight, with the fingers shaped by the same weight (Jeannerod 1984).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One target evaluation, one blend and one posture update.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The weight is clamped to [0, 1] so an overshooting time course cannot extrapolate the hand past its target; at weight 1 the target is used as it is, with no blend error.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per written second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `point`, `goal` and `AutoMovieMotionHumanHand.fingers`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its props only and holds no per-second state.
   */
  export function move(props: IMove): IAutoMovieMotionHumanPrimitive {
    const limb: "leftArm" | "rightArm" = `${props.side}Arm`;
    return {
      channels: [limb, `${props.side}Hand`],
      from: props.from,
      to: props.to,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const target: ITarget = props.target(posture, seconds);
        const s: number = Math.min(1, Math.max(0, props.weight(seconds)));
        const placed: ITarget =
          s >= 1
            ? target
            : {
                ...target,
                point: bowed(
                  posture,
                  props.side,
                  point(posture, props.origin),
                  target.point,
                  s,
                  props.curvature ?? 0,
                ),
                rotation: Quaternion.slerp(
                  Quaternion.multiply(
                    HumanFrame.turn(posture.yaw),
                    props.origin.rotation,
                  ),
                  target.rotation,
                  s,
                ),
              };
        return {
          ...posture,
          joints: {
            ...posture.joints,
            ...AutoMovieMotionHumanHand.fingers(
              props.side,
              target.shape,
              target.curl ?? 0,
              s,
            ),
          },
          limbs: {
            ...posture.limbs,
            [limb]: goal(props.body, props.side, placed),
          },
        };
      },
    };
  }

  /**
   * A point of a path from one point to another that bows out to the arm's
   * own side: the straight path's point plus a sideways deviation that is
   * greatest at the middle and none at both ends (EMOTE's indirect Space).
   * The side is the performer's left for the left arm and right for the
   * right, less its part along the path; a path that runs sideways bows up.
   */
  const bowed = (
    posture: Pick<IHumanPosture, "yaw">,
    side: HumanHand.Side,
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    share: number,
    curvature: number,
  ): IAutoMovieVector3 => {
    const straight: IAutoMovieVector3 = Vector3.lerp(from, to, share);
    const path: IAutoMovieVector3 = Vector3.subtract(to, from);
    const length: number = Vector3.length(path);
    if (curvature === 0 || length < 1e-9) return straight;
    const along: IAutoMovieVector3 = Vector3.scale(path, 1 / length);
    const across = (axis: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.subtract(axis, Vector3.scale(along, Vector3.dot(axis, along)));
    const outward: IAutoMovieVector3 = across(
      HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
        { x: side === "left" ? 1 : -1, y: 0, z: 0 },
      ),
    );
    const direction: IAutoMovieVector3 =
      Vector3.length(outward) > 0.1 ? outward : across({ x: 0, y: 1, z: 0 });
    return Vector3.add(
      straight,
      Vector3.scale(
        Vector3.normalize(direction),
        curvature * length * Math.sin(Math.PI * share),
      ),
    );
  };

  /**
   * A hand carried from an origin to its target between two instants, on the
   * clock's minimum-jerk progress.
   *
   * @param body The body.
   * @param clock The action's clock.
   * @param side The arm.
   * @param window The instants the reach starts and arrives at.
   * @param from Where the hand starts.
   * @param target The target.
   * @returns The primitive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two ends, the window and the time course.
   * @evidence contracts/development/implementation.md#principled-implementation A point-to-point hand movement follows the minimum-jerk profile (Flash and Hogan 1985), which the clock's progress is.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `move` with the clock's progress as the weight.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The window is two named instants of the clock, so no time is written twice.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `move` and the clock.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function reach(
    body: IHumanBody,
    clock: AutoMovieMotionClock.IClock,
    side: HumanHand.Side,
    window: readonly [string, string],
    from: IOrigin,
    target: Frame,
  ): IAutoMovieMotionHumanPrimitive {
    return move({
      body,
      side,
      from: clock.at(window[0]),
      to: clock.at(window[1]),
      origin: from,
      target,
      weight: (seconds: number): number =>
        clock.progress(window[0], window[1], seconds),
    });
  }

  /**
   * A hand kept on its target between two instants; the target may move (a
   * stroke's path, a partner's hand, a carried prop).
   *
   * @param body The body.
   * @param clock The action's clock.
   * @param side The arm.
   * @param window The instants the hold starts and ends at.
   * @param target The target.
   * @returns The primitive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the window and that the target may move.
   * @evidence contracts/development/implementation.md#principled-implementation A hand on its target is the movement at weight 1 throughout, so the target frame alone decides where the hand is.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `move` with a constant weight.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The origin `move` requires is never read at weight 1, so the identity origin passed is inert and stated here.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `move` and the clock.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function hold(
    body: IHumanBody,
    clock: AutoMovieMotionClock.IClock,
    side: HumanHand.Side,
    window: readonly [string, string],
    target: Frame,
  ): IAutoMovieMotionHumanPrimitive {
    return move({
      body,
      side,
      from: clock.at(window[0]),
      to: clock.at(window[1]),
      origin: { point: { x: 0, y: 0, z: 0 }, rotation: Quaternion.identity() },
      target,
      weight: (): number => 1,
    });
  }

  /**
   * A hand taken from its target back to an origin between two instants, on
   * the clock's minimum-jerk progress.
   *
   * @param body The body.
   * @param clock The action's clock.
   * @param side The arm.
   * @param window The instants the retraction starts and arrives at.
   * @param target The target the hand leaves.
   * @param to Where the hand ends.
   * @returns The primitive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two ends, the window and the time course.
   * @evidence contracts/development/implementation.md#principled-implementation A reach run backwards: the same minimum-jerk profile with the weight going from 1 to 0.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `move` with one minus the clock's progress.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The target stays a frame, so a hand leaving a moving thing starts from where the thing is.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `move` and the clock.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive closes over its arguments only.
   */
  export function retract(
    body: IHumanBody,
    clock: AutoMovieMotionClock.IClock,
    side: HumanHand.Side,
    window: readonly [string, string],
    target: Frame,
    to: IOrigin,
  ): IAutoMovieMotionHumanPrimitive {
    return move({
      body,
      side,
      from: clock.at(window[0]),
      to: clock.at(window[1]),
      origin: to,
      target,
      weight: (seconds: number): number =>
        1 - clock.progress(window[0], window[1], seconds),
    });
  }

  /**
   * What every arm phrase takes: the arm, the clock whose standard instants
   * (`AutoMovieMotionClock.PHRASE`) it moves on, and where the hand leaves
   * from and returns to.
   */
  export interface IPhrase {
    /** The body. */
    body: IHumanBody;

    /** A clock with the standard instants of a phrase. */
    clock: AutoMovieMotionClock.IClock;

    /** The arm. */
    side: HumanHand.Side;

    /** Where the hand is before and after the phrase. */
    origin: IOrigin;

    /**
     * What the hand bears on while it is on its place, when the place is
     * solid; absent for a place in the air, which gives no contact window.
     */
    contact?: Pick<IHumanContactWindow, "kind" | "support">;

    /**
     * The manner's sizes: the extent scales a place in the air and a
     * free-space amplitude, and the curvature bows the hand's way out and
     * back. A phrase that states a contact keeps its place whatever the
     * extent. Neutral when absent.
     */
    manner?: Pick<AutoMovieMotionManner.IModifiers, "extent" | "curvature">;
  }

  /**
   * A target with its point scaled about another point by the phrase's
   * extent; unchanged when the phrase states a contact, since a manner never
   * moves a goal on a solid place.
   */
  const extended = (
    props: Pick<IPhrase, "contact" | "manner">,
    about: IAutoMovieVector3,
    target: ITarget,
  ): ITarget => {
    const extent: number = props.manner?.extent ?? 1;
    return props.contact !== undefined || extent === 1
      ? target
      : {
          ...target,
          point: Vector3.add(
            about,
            Vector3.scale(Vector3.subtract(target.point, about), extent),
          ),
        };
  };

  /**
   * The contact window of a hand between two instants.
   *
   * @param props The phrase.
   * @param from The instant the hand comes to bear.
   * @param to The instant it leaves.
   * @returns One window when the phrase states a contact, none otherwise.
   */
  export function bearing(
    props: Pick<IPhrase, "clock" | "side" | "contact">,
    from: string,
    to: string,
  ): IHumanContactWindow[] {
    return props.contact === undefined
      ? []
      : [
          {
            part: `${props.side}Hand`,
            kind: props.contact.kind,
            from: props.clock.at(from) / props.clock.duration,
            to: props.clock.at(to) / props.clock.duration,
            support: props.contact.support,
          },
        ];
  }

  /**
   * A visit: the hand goes to a place, stays on it and comes back (a touch,
   * an offered hand, a hand laid on a table, a mimed grasp). It travels from
   * `start` to `stroke`, stays until `relax` and is back at `end`.
   *
   * @param props The phrase and the place's target.
   * @returns The primitive, with a contact window from `stroke` to `relax` when the phrase states a contact.
   */
  export function visit(
    props: IPhrase & { target: Frame },
  ): IAutoMovieMotionHumanPrimitive {
    return {
      ...move({
        body: props.body,
        side: props.side,
        from: 0,
        to: props.clock.duration,
        origin: props.origin,
        target: (posture: IHumanPosture, seconds: number): ITarget =>
          extended(
            props,
            point(posture, props.origin),
            props.target(posture, seconds),
          ),
        weight: (seconds: number): number =>
          props.clock.envelope(["start", "stroke"], ["relax", "end"], seconds),
        curvature: props.manner?.curvature ?? 0,
      }),
      contacts: bearing(props, "stroke", "relax"),
    };
  }

  /**
   * A stroke: the hand is brought to a ready pose by `ready`, waits until
   * `strokeStart`, follows a path until `strokeEnd`, stays at the path's end
   * until `relax` and is back at `end` (a gesture, a guard, a drawn line).
   *
   * @param props The phrase and the path: the target at the stroke's progress, 0 at the ready pose and 1 at the stroke's end.
   * @returns The primitive.
   */
  export function stroke(
    props: IPhrase & {
      path: (
        posture: IHumanPosture,
        seconds: number,
        progress: number,
      ) => ITarget;
    },
  ): IAutoMovieMotionHumanPrimitive {
    return {
      ...move({
        body: props.body,
        side: props.side,
        from: 0,
        to: props.clock.duration,
        origin: props.origin,
        target: (posture: IHumanPosture, seconds: number): ITarget => {
          const progress: number = props.clock.progress(
            "strokeStart",
            "strokeEnd",
            seconds,
          );
          const at: ITarget = props.path(posture, seconds, progress);
          return progress <= 0
            ? at
            : extended(props, props.path(posture, seconds, 0).point, at);
        },
        weight: (seconds: number): number =>
          props.clock.envelope(["start", "ready"], ["relax", "end"], seconds),
        curvature: props.manner?.curvature ?? 0,
      }),
      contacts: bearing(props, "strokeStart", "relax"),
    };
  }

  /**
   * A strike: the hand is drawn to a chamber by `ready`, extends from
   * `strokeStart` and passes its target at `stroke` at speed. With a follow
   * phase it travels on past the target and slows to rest at `strokeEnd` (a
   * punch in the air); with none it is arrested at the target (a fist met by
   * a body). It stays until `relax` and is back at `end`.
   *
   * @param props The phrase, the chamber, the target and the weapons the strike carries.
   * @returns The primitive, with a contact window from `stroke` to `relax` when the phrase states a contact.
   */
  export function strike(
    props: IPhrase & {
      chamber: Frame;
      target: Frame;
      weapons?: readonly IHumanActionPlan.IWeapon[];
    },
  ): IAutoMovieMotionHumanPrimitive {
    return {
      ...move({
        body: props.body,
        side: props.side,
        from: 0,
        to: props.clock.duration,
        origin: props.origin,
        target: (posture: IHumanPosture, seconds: number): ITarget => {
          const chamber: ITarget = props.chamber(posture, seconds);
          const p: number = AutoMovieMotionClock.through(
            props.clock,
            ["strokeStart", "stroke", "strokeEnd"],
            seconds,
          );
          if (p <= 0) return chamber;
          const target: ITarget = extended(
            props,
            chamber.point,
            props.target(posture, seconds),
          );
          return {
            ...target,
            point: Vector3.add(
              chamber.point,
              Vector3.scale(Vector3.subtract(target.point, chamber.point), p),
            ),
            rotation: Quaternion.slerp(
              chamber.rotation,
              target.rotation,
              Math.min(1, p),
            ),
            bend: Vector3.lerp(chamber.bend, target.bend, Math.min(1, p)),
          };
        },
        weight: (seconds: number): number =>
          props.clock.envelope(["start", "ready"], ["relax", "end"], seconds),
        curvature: props.manner?.curvature ?? 0,
      }),
      contacts: bearing(props, "stroke", "relax"),
      ...(props.weapons === undefined ? {} : { weapons: props.weapons }),
    };
  }

  /**
   * An oscillation: the hand is brought to a pose by `ready`, moves back and
   * forth about it from `strokeStart` to `strokeEnd` and is back at `end` (a
   * wave, a pump, a rub).
   *
   * @param props The phrase, the cycle count and the pose: the target at a swing in [-1, 1] about the pose.
   * @returns The primitive.
   */
  export function oscillate(
    props: IPhrase & {
      cycles: number;
      pose: (posture: IHumanPosture, seconds: number, swing: number) => ITarget;
    },
  ): IAutoMovieMotionHumanPrimitive {
    return {
      ...move({
        body: props.body,
        side: props.side,
        from: 0,
        to: props.clock.duration,
        origin: props.origin,
        target: (posture: IHumanPosture, seconds: number): ITarget =>
          props.pose(
            posture,
            seconds,
            (props.contact === undefined ? (props.manner?.extent ?? 1) : 1) *
              AutoMovieMotionClock.wave(
                props.clock,
                ["strokeStart", "strokeEnd"],
                props.cycles,
                seconds,
              ),
          ),
        weight: (seconds: number): number =>
          props.clock.envelope(["start", "ready"], ["relax", "end"], seconds),
        curvature: props.manner?.curvature ?? 0,
      }),
      contacts: bearing(props, "strokeStart", "strokeEnd"),
    };
  }

  /** An arm's joint angles in a swing: clinical degrees of the shoulder and the elbow. */
  export interface ISwing {
    /** The upper arm's `[flexion, abduction, twist]`, degrees. */
    upper: readonly [number, number, number];

    /** The elbow's flexion, degrees. */
    elbow: number;
  }

  /**
   * A swing: the arm hangs from the shoulder and swings about it as a
   * pendulum, by joint angles and with no goal for the hand (the arm swing of
   * a walk, a run, a jump). The arm's limb goal is released for the window.
   *
   * @param side The arm.
   * @param from Seconds since the action's start from which the arm is written.
   * @param to Seconds since the action's start until which the arm is written.
   * @param angles The shoulder's and the elbow's angles at a second.
   * @returns The primitive, on the arm's channel.
   */
  export function swing(
    side: HumanHand.Side,
    from: number,
    to: number,
    angles: (posture: IHumanPosture, seconds: number) => ISwing,
  ): IAutoMovieMotionHumanPrimitive {
    const limb: "leftArm" | "rightArm" = `${side}Arm`;
    return {
      channels: [limb],
      from,
      to,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => {
        const swung: ISwing = angles(posture, seconds);
        const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
        delete limbs[limb];
        return {
          ...posture,
          joints: {
            ...posture.joints,
            [`${side}UpperArm`]: swung.upper,
            [`${side}LowerArm`]: [swung.elbow, 0, 0],
          },
          limbs,
        };
      },
    };
  }
}
