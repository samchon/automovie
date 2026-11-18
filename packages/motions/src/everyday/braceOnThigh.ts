import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMoviePose,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { braceOnThighPoint } from "./braceOnThighPoint";

/**
 * A palm carried from the angles the arm held onto its own thigh just above
 * the knee (`braceOnThighPoint`), the hand support of a low posture, read on
 * the legs the action has placed.
 *
 * @param body The body.
 * @param side The hand and thigh.
 * @param rest The arm's angles at weight 0.
 * @param duration The action's duration, seconds; the arm is written over all of it.
 * @param weight How far the palm is on the thigh at a second, in [0, 1].
 * @param span The reach, hold and return instants, when the caller has them.
 * @param group The other arm on the same body.
 * @param apart Whether the grouped arms remain on their own sides.
 * @returns The primitive, on the arm's channel.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the place and its owner, the frame it rides and the weight.
 * @evidence contracts/development/implementation.md#principled-implementation The brace point, its normal and the fingers' direction are `braceOnThighPoint`'s on the solved thigh and knee; the palm faces the thigh, open and flat.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One arm carry with one goal; the point is shared with the bend law's free hand.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No value of its own: the place is `braceOnThighPoint`'s, read from the body's hand and leg.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each goal resolves the posture demanding only the braced thigh and knee; the resolver falls back to its full fit for any dependency it cannot prove irrelevant.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The demanded bone names are prepared once per primitive; each goal may borrow its carrier's FK workspace and ROM projector for its own synchronous solve. No fitted answer is shared across seconds.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The primitive holds its arguments and the prepared names only; borrowed workspaces end with each goal call.
 */
export function braceOnThigh(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  rest: IAutoMovieMotionHumanArmAngles.IAngles,
  duration: number,
  weight: (seconds: number) => number,
  span?: IAutoMovieMotionHumanArmPlanned.ISpan,
  group?: IAutoMovieMotionHumanArmPlanned.ITogether,
  apart: boolean = true,
): IAutoMovieMotionHumanPrimitive {
  const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
    `${side}UpperLeg`, `${side}LowerLeg`, `${side}UpperArm`,
  ]);
  const readLeg: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, requested);
  const site: ReturnType<typeof braceOnThighPoint> = braceOnThighPoint(body, side);
  const palm: ReturnType<typeof AutoMovieMotionHumanArmTarget.prepareSurfaceGoal> = AutoMovieMotionHumanArmTarget.prepareSurfaceGoal(body, side, "palm", "flat");
  return AutoMovieMotionHumanArm.carried({
    body,
    side,
    from: 0,
    to: duration,
    rest,
    weight,
    ...(span === undefined ? {} : { span, on: `${side}UpperLeg` }),
    ...(group === undefined ? {} : apart ? { beside: group } : { together: group }),
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
      const brace: ReturnType<typeof site> = site(readLeg(pose, resolution()));
      return palm({
        point: brace.point,
        rotation: brace.rotation,
        bend: Vector3.addScaled(
          AutoMovieMotionHumanBend.hang(body, posture, side),
          brace.normal,
          body.measure.forearmRadius,
        ),
      });
    },
  });
}
