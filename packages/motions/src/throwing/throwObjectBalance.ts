import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanThrowObjectParams,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The free arm of an underarm delivery held out for balance: as the ball
 * arm swings back and through, the other arm reaches out to its side, a
 * little ahead and below the shoulder (the bowler's balance arm), clear of
 * the trunk the delivery turns and inclines, and returns as the delivery
 * recovers. The hand is placed `REACH` of the arm's length out from its
 * shoulder, `DROP` of it down and `AHEAD` of it forward, palm down and the
 * fingers out; it comes in over the windup and leaves over the recovery.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the role, where the hand goes, its attitude and its timing.
 * @evidence contracts/development/design.md#principled-representation One arm movement on the delivery's clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The three shares and one builder.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The place is a share of the body's own arm, read from the posed shoulder.
 */
export namespace throwObjectBalance {
  /** How far out the balance hand reaches, a share of the arm's length (provisional). */
  export const REACH: number = 0.85;

  /** How far below the shoulder, a share of the arm's length (provisional). */
  export const DROP: number = 0.3;

  /** How far ahead of the shoulder, a share of the arm's length (provisional). */
  export const AHEAD: number = 0.25;

  /**
   * The balance arm's primitive.
   *
   * @param context The delivery's context.
   * @param clock The delivery's clock: `windup`, `cocked`, `recover` and `end`.
   * @returns The primitive for a bowling delivery's free arm; none for another style.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs.
   * @evidence contracts/development/implementation.md#principled-implementation The hand placed in the posture's heading frame from the posed shoulder, moved in and out on minimum-jerk weights from the entry's own hand.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Origin, target, weight.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The shoulder is read from the current posture.
   * @evidence contracts/development/implementation.md#efficient-algorithms One shoulder FK per sample.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The shared arm movement and hand attitude.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the origin.
   */
  export function of(
    context: Pick<
      IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanThrowObjectParams>,
      "body" | "entry" | "params"
    >,
    clock: IAutoMovieMotionClock,
  ): IAutoMovieMotionHumanPrimitive[] {
    if (context.params.style !== "bowling") return [];
    const side: AutoMovieHumanSide =
      (context.params.hand ?? "right") === "left" ? "right" : "left";
    const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
    const arm: number = body.measure.upperArm + body.measure.forearm;
    const out: number = side === "left" ? 1 : -1;
    const shoulderBone: AutoMovieHumanoidBone =
      side === "left" ? "leftUpperArm" : "rightUpperArm";
    const handBone: AutoMovieHumanoidBone =
      side === "left" ? "leftHand" : "rightHand";
    return [
      AutoMovieMotionHumanArm.move({
        body,
        side,
        from: 0,
        to: clock.duration,
        origin: AutoMovieMotionHumanArm.origin(
          body,
          poseBones(
            body,
            context.entry.pose,
            undefined,
            new Set<AutoMovieHumanoidBone>([handBone]),
          ),
          {
            origin: context.entry.posture.root,
            yaw: context.entry.posture.yaw,
          },
          side,
          "palm",
        ),
        target: (
          posture: IAutoMovieMotionHumanPosture,
        ): IAutoMovieMotionHumanArmTarget.ITarget => {
          const shoulder: IAutoMovieVector3 = poseBones(
            body,
            resolveHumanPosture(body, { ...posture, limbs: {} }),
            undefined,
            new Set<AutoMovieHumanoidBone>([shoulderBone]),
          ).get(shoulderBone)!.worldPosition;
          const point: IAutoMovieVector3 = HumanFrame.point(
            { origin: shoulder, yaw: posture.yaw },
            {
              x: out * REACH * arm,
              y: -DROP * arm,
              z: AHEAD * arm,
            },
          );
          const outward: IAutoMovieVector3 = HumanFrame.point(
            { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
            { x: out, y: 0, z: 0 },
          );
          return {
            surface: "palm",
            shape: "relaxed",
            point,
            rotation: HumanHand.rotation(side, {
              fingers: outward,
              palm: { x: 0, y: -1, z: 0 },
            }),
            // The elbow halfway out, a little below and behind the line.
            bend: Vector3.add(
              Vector3.lerp(shoulder, point, 0.5),
              HumanFrame.point(
                { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
                { x: 0, y: -0.15 * arm, z: -0.15 * arm },
              ),
            ),
          };
        },
        weight: (seconds: number): number =>
          minimumJerk.share(clock.linear("windup", "cocked", seconds)) *
          (1 - minimumJerk.share(clock.linear("recover", "end", seconds))),
      }),
    ];
  }
}
