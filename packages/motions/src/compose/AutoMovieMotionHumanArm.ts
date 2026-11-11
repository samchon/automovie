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
import type { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import { AutoMovieMotionHumanHand } from "./AutoMovieMotionHumanHand";
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
 */
export namespace AutoMovieMotionHumanArm {
  /** Where a hand surface goes and how the hand is held there, world frame. */
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
   * A target as a frame of the action.
   *
   * @param posture The posture so far at this second.
   * @param seconds Seconds since the action's start.
   * @returns The target.
   */
  export type Frame = (posture: IHumanPosture, seconds: number) => ITarget;

  /** Where a hand is before or after its movement, in the performer's floor frame. */
  export interface IOrigin {
    /** The surface's point; `x` left, `y` up, `z` forward of the root, metres. */
    point: IAutoMovieVector3;

    /** The hand's rotation from its rest, relative to the heading. */
    rotation: IAutoMovieQuaternion;
  }

  /** One arm's movement. */
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
   * How long a hand takes to travel a distance: `0.25 + 0.5 D` seconds for
   * `D` metres (provisional; a gesture's preparation lasts a few tenths of a
   * second and reaching time grows with distance, Fitts 1954).
   *
   * @param distance Metres.
   * @returns Seconds.
   */
  export function transport(distance: number): number {
    return 0.25 + 0.5 * distance;
  }

  /**
   * An arm moved between an origin and a target by a weight.
   *
   * @param props The movement.
   * @returns The primitive, on the arm's and the hand's channels.
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
                point: Vector3.lerp(
                  point(posture, props.origin),
                  target.point,
                  s,
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
}
