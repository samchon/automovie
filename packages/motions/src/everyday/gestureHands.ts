import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanArmTrajectory,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGesture,
  IAutoMovieMotionHumanGestureStroke,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmPlanned } from "../compose/AutoMovieMotionHumanArmPlanned";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanHand } from "../posture/HumanHand";
import { HumanHandShape } from "../posture/HumanHandShape";
import { handGoals } from "./handGoals";

/**
 * A gesture's hands: each moving hand's request on the stroke's goal and its
 * fingers' shape at a second, and the moving arms planned over the whole
 * gesture as one trajectory (`AutoMovieMotionHumanArmPlanned`).
 */
export namespace gestureHands {
  /** What the gesture is at a second before its arms: the posture, the hands' requests and the transport's share. */
  export interface IPrior {
    /** The posture before the arms. */
    posture: IAutoMovieMotionHumanPosture;
    /** Each moving hand's request on the stroke's goal. */
    requests: IAutoMovieMotionHumanArmTarget.ISided[];
    /** The transport's share, 0 at rest and 1 on the stroke. */
    envelope: number;
  }

  /**
   * One moving hand at a second: its request on the stroke's goal, the hand
   * turned in its own palm's plane (mirrored for the left hand) and its
   * aimed digit pointed at the world's up or down, and its fingers from the
   * relaxed cascade to the gesture's shape by the transport's share.
   *
   * @param body The body.
   * @param posture The posture before the arms.
   * @param side The hand.
   * @param goal The stroke's goal for the hand.
   * @param p The gesture's turn, emblem and aim.
   * @param digit The aimed digit's direction in the hand's frame, when one is aimed.
   * @param elbow The effort's elbow modifier, degrees.
   * @param envelope The transport's share.
   * @returns The request and the fingers' joints.
   */
  export function hand(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: IAutoMovieMotionHumanHand.Side,
    goal: IAutoMovieMotionHumanGestureStroke.IHand,
    p: Pick<IAutoMovieMotionHumanGesture.IParams, "turn" | "shape" | "aim">,
    digit: IAutoMovieVector3 | undefined,
    elbow: number,
    envelope: number,
  ): {
    request: IAutoMovieMotionHumanArmTarget.ISided;
    fingers: IAutoMovieMotionHumanPosture["joints"];
  } {
    const turned: IAutoMovieQuaternion =
      p.turn === undefined
        ? goal.rotation
        : Quaternion.multiply(
            goal.rotation,
            Quaternion.fromAxisAngle(
              { x: 0, y: -1, z: 0 },
              (side === "left" ? -1 : 1) * p.turn,
            ),
          );
    const request: IAutoMovieMotionHumanArmTarget.ISided = {
      side,
      surface: goal.surface,
      shape: goal.shape,
      point: goal.point,
      rotation:
        digit === undefined || p.aim === undefined
          ? turned
          : HumanHandShape.aim(turned, digit, p.aim.toward),
      bend:
        goal.elbow === undefined
          ? AutoMovieMotionHumanBend.hang(body, posture, side, goal.out + elbow)
          : AutoMovieMotionHumanBend.arm(
              body,
              posture,
              side,
              goal.elbow,
              goal.out + elbow,
            ),
    };
    const shape: ReturnType<typeof HumanHand.shape> =
      p.shape === undefined
        ? HumanHand.shape(side, goal.shape)
        : HumanHandShape.emblem(side, p.shape);
    const relaxed: ReturnType<typeof HumanHand.shape> = HumanHand.shape(
      side,
      "relaxed",
    );
    const fingers: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const bone of Object.keys(shape) as AutoMovieHumanoidBone[]) {
      const a: readonly [number, number, number] = shape[bone]!;
      const r: readonly [number, number, number] = relaxed[bone]!;
      const curl: number =
        bone.includes("Thumb") || p.shape !== undefined ? 0 : (goal.curl ?? 0);
      fingers[bone] = [
        r[0] + (a[0] + curl - r[0]) * envelope,
        a[1] * envelope,
        0,
      ];
    }
    return { request, fingers };
  }

  /**
   * The moving arms planned over the whole gesture as one trajectory: from
   * the entry's arms to the stroke's goals, held on them through the stroke,
   * and on to the rest arms, read off the gesture's own posture before its
   * arms.
   *
   * @param body The body.
   * @param span The gesture's preparation start, stroke start, retraction start and end.
   * @param sides The moving hands.
   * @param begin Each arm at the entry.
   * @param rest Each arm at rest.
   * @param prior The gesture before its arms at a second.
   * @returns Each arm's trajectory.
   */
  export function planned(
    body: IAutoMovieMotionHumanBody,
    span: IAutoMovieMotionHumanArmPlanned.ISpan,
    sides: readonly IAutoMovieMotionHumanHand.Side[],
    begin: Partial<
      Record<
        IAutoMovieMotionHumanHand.Side,
        IAutoMovieMotionHumanArmAngles.IAngles
      >
    >,
    rest: Partial<
      Record<
        IAutoMovieMotionHumanHand.Side,
        IAutoMovieMotionHumanArmAngles.IAngles
      >
    >,
    prior: (seconds: number) => IPrior,
  ): Map<
    IAutoMovieMotionHumanHand.Side,
    IAutoMovieMotionHumanArmTrajectory.Trajectory
  > {
    return AutoMovieMotionHumanArmPlanned.planned(
      body,
      span,
      sides.map(
        (
          side: IAutoMovieMotionHumanHand.Side,
        ): IAutoMovieMotionHumanArmPlanned.IPlanned => ({
          side,
          rest: begin[side]!,
          back: rest[side]!,
          goal: (
            _: IAutoMovieMotionHumanPosture,
            at: number,
          ): IAutoMovieMotionHumanPosture.IGoal => {
            const before: IPrior = prior(at);
            return handGoals(body, before.posture, before.requests).limbs[
              `${side}Arm`
            ]!;
          },
          weight: (at: number): number => prior(at).envelope,
        }),
      ),
      (at: number): IAutoMovieMotionHumanPosture => prior(at).posture,
    );
  }

  /**
   * A posture with the planned arms written as joints at a second.
   *
   * @param posture The posture before the arms.
   * @param arms Each arm's trajectory.
   * @param seconds The second.
   * @returns The posture.
   */
  export function written(
    posture: IAutoMovieMotionHumanPosture,
    arms: ReadonlyMap<
      IAutoMovieMotionHumanHand.Side,
      IAutoMovieMotionHumanArmTrajectory.Trajectory
    >,
    seconds: number,
  ): IAutoMovieMotionHumanPosture {
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    for (const [side, trajectory] of arms) {
      const arm: ReturnType<IAutoMovieMotionHumanArmTrajectory.Trajectory> =
        trajectory(seconds);
      joints[`${side}UpperArm`] = arm.upper;
      joints[`${side}LowerArm`] = arm.lower;
      joints[`${side}Hand`] = arm.hand;
      delete limbs[`${side}Arm`];
    }
    return { ...posture, joints, limbs };
  }
}
