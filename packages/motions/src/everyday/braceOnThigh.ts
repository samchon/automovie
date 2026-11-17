import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A palm carried from the angles the arm held onto its own thigh just above
 * the knee, the hand support of a low posture (Kingma, Faber and van Dieen
 * 2016, J Biomech 49:881), read on the legs the action has placed.
 *
 * @param body The body.
 * @param side The hand and thigh.
 * @param rest The arm's angles at weight 0.
 * @param duration The action's duration, seconds; the arm is written over all of it.
 * @param weight How far the palm is on the thigh at a second, in [0, 1].
 * @returns The primitive, on the arm's channel.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the place, its source, the frame it rides and the weight.
 * @evidence contracts/development/implementation.md#principled-implementation The thigh's front region is placed on the solved thigh and moved 0.6 of the way toward the knee; the palm faces it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One arm carry with one goal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The 0.6 share toward the knee is provisional, the bend law's brace point.
 * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per written second for the thigh.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the crouch and the kneel.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Closes over its arguments only.
 */
export function braceOnThigh(
  body: IAutoMovieMotionHumanBody,
  side: "left" | "right",
  rest: IAutoMovieMotionHumanArmAngles.IAngles,
  duration: number,
  weight: (seconds: number) => number,
): IAutoMovieMotionHumanPrimitive {
  return AutoMovieMotionHumanArm.carried({
    body,
    side,
    from: 0,
    to: duration,
    rest,
    weight,
    goal: (posture: IAutoMovieMotionHumanPosture): IAutoMovieHumanLimbGoal => {
      const bones = poseBones(body, resolveHumanPosture(body, posture));
      const thigh = bones.get(`${side}UpperLeg`)!;
      const kneeAt: IAutoMovieVector3 = bones.get(
        `${side}LowerLeg`,
      )!.worldPosition;
      const region =
        body.surfaces.regions[
          side === "left" ? "thighFrontLeft" : "thighFrontRight"
        ];
      const onThigh: IAutoMovieVector3 = Vector3.add(
        thigh.worldPosition,
        Quaternion.rotateVector(thigh.worldRotation, region.point),
      );
      const point: IAutoMovieVector3 = Vector3.lerp(
        onThigh,
        Vector3.add(
          kneeAt,
          Vector3.subtract(
            onThigh,
            Vector3.lerp(thigh.worldPosition, kneeAt, 0.5),
          ),
        ),
        0.6,
      );
      return AutoMovieMotionHumanArm.goal(
        body,
        side,
        AutoMovieMotionHumanTarget.hand(
          body,
          posture,
          side,
          {
            point,
            normal: Quaternion.rotateVector(thigh.worldRotation, region.normal),
          },
          {
            surface: "palm",
            shape: "relaxed",
            forward: Vector3.subtract(kneeAt, thigh.worldPosition),
          },
        ),
      );
    },
  });
}
