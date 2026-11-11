import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { AutoMovieMotionClock } from "./AutoMovieMotionClock";
import type { IAutoMovieMotionHumanPrimitive } from "./IAutoMovieMotionHumanPrimitive";

/**
 * Leg primitives: a foot kept on the floor, and a foot lifted and set down
 * somewhere else.
 *
 * A foot is a placement of its ankle and its rotation ({@link HumanFoot}),
 * and the leg is an effector goal solved by inverse kinematics. A planted
 * foot declares its toes' joint as the goal's contact, so where the ankle
 * cannot hold the foot flat the heel rises about the ball and the foot does
 * not slide (`HumanFoot.heelOff`). The knee bends over the foot: its hint is
 * ahead of the knee's rest place along the foot's own heading (Perry and
 * Burnfield, Gait Analysis, 2nd ed.).
 */
export namespace AutoMovieMotionHumanLeg {
  /** A leg side. */
  export type Side = "left" | "right";

  /**
   * A foot's placement as a frame of the action.
   *
   * @param posture The posture so far at this second.
   * @param seconds Seconds since the action's start.
   * @returns The placement, world frame.
   */
  export type Frame = (
    posture: IHumanPosture,
    seconds: number,
  ) => HumanFoot.IPlacement;

  /** One leg's movement. */
  export interface IPlace {
    /** The body. */
    body: IHumanBody;

    /** The leg. */
    side: Side;

    /** Seconds since the action's start from which the leg is written. */
    from: number;

    /** Seconds since the action's start until which the leg is written. */
    to: number;

    /** Where the foot is. */
    placement: Frame;

    /**
     * Whether the foot bears on the floor.
     *
     * @param seconds Seconds since the action's start.
     * @returns `true` while it is planted.
     */
    planted(seconds: number): boolean;
  }

  /**
   * A foot on its way from one placement to another: the ankle on the
   * straight line between them raised by `4 c s (1 - s)`, a parabola that
   * leaves and lands at the floor and peaks at the clearance `c` half way,
   * and the rotation turned by spherical interpolation.
   *
   * @param from The placement at progress 0.
   * @param to The placement at progress 1.
   * @param clearance The ankle's greatest rise, metres.
   * @param progress How far along, in [0, 1].
   * @returns The placement.
   */
  export function arc(
    from: HumanFoot.IPlacement,
    to: HumanFoot.IPlacement,
    clearance: number,
    progress: number,
  ): HumanFoot.IPlacement {
    const s: number = Math.min(1, Math.max(0, progress));
    const ankle: IAutoMovieVector3 = Vector3.lerp(from.ankle, to.ankle, s);
    return {
      ankle: { ...ankle, y: ankle.y + 4 * clearance * s * (1 - s) },
      rotation: Quaternion.slerp(from.rotation, to.rotation, s),
    };
  }

  /**
   * The limb goal that puts a foot on a placement.
   *
   * @param body The body.
   * @param posture The posture whose root carries the knee's rest place.
   * @param side The leg.
   * @param placement The foot's placement.
   * @param planted Whether the foot bears on the floor.
   * @returns The goal.
   */
  export function goal(
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw">,
    side: Side,
    placement: HumanFoot.IPlacement,
    planted: boolean,
  ): IHumanPosture.IGoal {
    const knee: IAutoMovieVector3 = HumanFrame.point(
      { origin: posture.root, yaw: posture.yaw },
      body.rest.get(`${side}LowerLeg`)!,
    );
    return {
      point: placement.ankle,
      rotation: placement.rotation,
      bend: HumanFrame.point(
        { origin: knee, yaw: HumanFoot.heading(placement.rotation) },
        { x: 0, y: 0, z: 1 },
      ),
      ...(planted
        ? { planted: true, contact: HumanFoot.offset(body, side, "mtp") }
        : {}),
    };
  }

  /**
   * A leg whose foot follows a placement.
   *
   * @param props The movement.
   * @returns The primitive, on the leg's channel.
   */
  export function place(props: IPlace): IAutoMovieMotionHumanPrimitive {
    const limb: "leftLeg" | "rightLeg" = `${props.side}Leg`;
    return {
      channels: [limb],
      from: props.from,
      to: props.to,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => ({
        ...posture,
        limbs: {
          ...posture.limbs,
          [limb]: goal(
            props.body,
            posture,
            props.side,
            props.placement(posture, seconds),
            props.planted(seconds),
          ),
        },
      }),
    };
  }

  /**
   * A foot kept planted on one placement between two instants.
   *
   * @param body The body.
   * @param clock The action's clock.
   * @param side The leg.
   * @param window The instants the plant starts and ends at.
   * @param at Where the foot stands.
   * @returns The primitive.
   */
  export function plant(
    body: IHumanBody,
    clock: AutoMovieMotionClock.IClock,
    side: Side,
    window: readonly [string, string],
    at: HumanFoot.IPlacement,
  ): IAutoMovieMotionHumanPrimitive {
    return place({
      body,
      side,
      from: clock.at(window[0]),
      to: clock.at(window[1]),
      placement: (): HumanFoot.IPlacement => at,
      planted: (): boolean => true,
    });
  }

  /**
   * A foot lifted from one placement and set down on another between two
   * instants, on the clock's minimum-jerk progress along {@link arc}. The
   * foot is free inside the window and planted at its last instant.
   *
   * @param body The body.
   * @param clock The action's clock.
   * @param side The leg.
   * @param window The instants the foot leaves and lands at.
   * @param from Where the foot leaves.
   * @param to Where the foot lands.
   * @param clearance The ankle's greatest rise, metres.
   * @returns The primitive.
   */
  export function step(
    body: IHumanBody,
    clock: AutoMovieMotionClock.IClock,
    side: Side,
    window: readonly [string, string],
    from: HumanFoot.IPlacement,
    to: HumanFoot.IPlacement,
    clearance: number,
  ): IAutoMovieMotionHumanPrimitive {
    return place({
      body,
      side,
      from: clock.at(window[0]),
      to: clock.at(window[1]),
      placement: (_: IHumanPosture, seconds: number): HumanFoot.IPlacement =>
        arc(from, to, clearance, clock.progress(window[0], window[1], seconds)),
      planted: (seconds: number): boolean =>
        clock.linear(window[0], window[1], seconds) >= 1,
    });
  }
}
