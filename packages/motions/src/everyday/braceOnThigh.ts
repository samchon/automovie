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
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { braceOnThighPoint } from "./braceOnThighPoint";

/**
 * A palm carried from the angles the arm held onto its own thigh just above the
 * knee (`braceOnThighPoint`), the hand support of a low posture, read on the
 * legs the action has placed.
 *
 * @param body The body.
 * @param side The hand and thigh.
 * @param rest The arm's angles at weight 0.
 * @param duration The action's duration, seconds; the arm is written over all
 *   of it.
 * @param weight How far the palm is on the thigh at a second, in [0, 1].
 * @param span The reach, hold and return instants, when the caller has them.
 * @param group The other arm on the same body.
 * @param apart Whether the grouped arms remain on their own sides.
 * @returns The primitive, on the arm's channel.
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
  supporting?: IAutoMovieVector3,
): IAutoMovieMotionHumanPrimitive {
  const requested: ReadonlySet<AutoMovieHumanoidBone> =
    new Set<AutoMovieHumanoidBone>([
      `${side}UpperLeg`,
      `${side}LowerLeg`,
      `${side}UpperArm`,
    ]);
  const readLeg: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    requested,
  );
  const site: ReturnType<typeof braceOnThighPoint> = braceOnThighPoint(
    body,
    side,
    supporting,
  );
  const palm: ReturnType<
    typeof AutoMovieMotionHumanArmTarget.prepareSurfaceGoal
  > = AutoMovieMotionHumanArmTarget.prepareSurfaceGoal(
    body,
    side,
    "palm",
    "flat",
  );
  return AutoMovieMotionHumanArm.carried({
    body,
    side,
    from: 0,
    to: duration,
    rest,
    weight,
    ...(span === undefined ? {} : { span, on: `${side}UpperLeg` }),
    ...(group === undefined
      ? {}
      : apart
        ? { beside: group }
        : { together: group }),
    goal: (
      posture: IAutoMovieMotionHumanPosture,
      _seconds: number,
      source?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
    ): IAutoMovieHumanLimbGoal => {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution(source);
      const pose: IAutoMoviePose = resolveHumanPosture.seeded(
        body,
        posture,
        undefined,
        {},
        resolution,
        requested,
        projection,
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
