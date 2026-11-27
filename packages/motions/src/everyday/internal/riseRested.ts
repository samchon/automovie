import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { seated } from "./seated";

/**
 * Keep a rise's planted legs reachable before resting its hands on the same
 * lowered body's thighs or armrests. Both phases use this owner so their actual
 * hip and hand observations can borrow one synchronous FK workspace; current
 * joints and limb fits still run normally.
 *
 * @param body The unchanged body for this evaluation.
 * @param posture The current authored root, trunk and planted leg goals.
 * @param rests Optional world-metre armrest points, otherwise thighs.
 * @param yaw The seat heading, degrees about +Y.
 * @param share The existing hand-rest progress; endpoint rules belong to
 *   seated.rested.
 * @param resolution Optional parent FK source, released with this call.
 * @param projection Optional genuine parent ROM source, released with this
 *   call.
 * @returns The same canonical lowered and hand-rested posture as the two
 *   original operations.
 */
export function riseRested(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  rests: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> | undefined,
  yaw: number,
  share: number,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: ReturnType<typeof prepareHumanPostureProjection>,
): IAutoMovieMotionHumanPosture {
  if (share <= 0)
    return lowerHumanPosture(body, posture, undefined, resolution);
  const read: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution(resolution);
  const project: ReturnType<typeof prepareHumanPostureProjection> =
    projection ?? prepareHumanPostureProjection(body);
  return seated.rested(
    body,
    lowerHumanPosture(body, posture, undefined, read),
    rests,
    yaw,
    share,
    read,
    project,
  );
}
