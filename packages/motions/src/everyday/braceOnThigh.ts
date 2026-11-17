import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
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
 * @evidence contracts/development/implementation.md#efficient-algorithms Requests only the braced thigh and knee from canonical resolution/FK. The common resolver retains complete direct-joint admission and falls back to its full fitting path for dependencies its selective contract cannot prove irrelevant.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Body/side fix the region and compile requested names once. Each actual goal borrows its carrier's optional FK/ROM prerequisites through selective seeded fitting and current bone placement; without a loan it creates the original local workspace. No fitted answer is shared across seconds.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive holds fixed arguments/name demand/surface metadata only. Goal calls borrow dynamic FK/projector only until synchronous return or throw, and local workspaces/maps end there too; neither loan enters returned goal data, the primitive or a time-history cache.
 */
export function braceOnThigh(
  body: IAutoMovieMotionHumanBody,
  side: "left" | "right",
  rest: IAutoMovieMotionHumanArmAngles.IAngles,
  duration: number,
  weight: (seconds: number) => number,
): IAutoMovieMotionHumanPrimitive {
  const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
    `${side}UpperLeg`, `${side}LowerLeg`,
  ]);
  const readLeg: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, requested);
  const region: IAutoMovieMotionHumanBody["surfaces"]["regions"]["thighFrontLeft"] =
    body.surfaces.regions[side === "left" ? "thighFrontLeft" : "thighFrontRight"];
  return AutoMovieMotionHumanArm.carried({
    body,
    side,
    from: 0,
    to: duration,
    rest,
    weight,
    goal: (
      posture: IAutoMovieMotionHumanPosture,
      _seconds: number,
      source?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
    ): IAutoMovieHumanLimbGoal => {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(source);
      const pose: IAutoMoviePose = resolveHumanPosture.seeded(
        body, posture, undefined, {}, resolution, requested, projection,
      ).pose;
      const bones: ReturnType<typeof poseBones> = readLeg(pose, resolution());
      const thigh: IAutoMovieResolvedBone = bones.get(`${side}UpperLeg`)!;
      const kneeAt: IAutoMovieVector3 = bones.get(
        `${side}LowerLeg`,
      )!.worldPosition;
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
            // An open hand: the palm and the straight fingers and thumb lie on
            // the thigh, where the relaxed cascade curled them into it.
            surface: "palm",
            shape: "flat",
            forward: Vector3.subtract(kneeAt, thigh.worldPosition),
          },
        ),
      );
    },
  });
}
