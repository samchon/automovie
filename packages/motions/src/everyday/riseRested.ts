import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { seated } from "./seated";

/**
 * Keep a rise's planted legs reachable before resting its hands on the
 * same lowered body's thighs or armrests. Both phases use this owner so
 * their actual hip and hand observations can borrow one synchronous FK
 * workspace; current joints and limb fits still run normally.
 *
 * @param body The unchanged body for this evaluation.
 * @param posture The current authored root, trunk and planted leg goals.
 * @param rests Optional world-metre armrest points, otherwise thighs.
 * @param yaw The seat heading, degrees about +Y.
 * @param share The existing hand-rest progress; endpoint rules belong to seated.rested.
 * @param resolution Optional parent FK source, released with this call.
 * @param projection Optional genuine parent ROM source, released with this call.
 * @returns The same canonical lowered and hand-rested posture as the two original operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States operation order, current goals, world/degree inputs, endpoint owner and nonescaping optional parent loans.
 * @evidence contracts/development/implementation.md#principled-implementation Applies resolveHumanPosture.lower's original planted-leg reach cleanup first, then seated.rested's unchanged achieved-thigh/armrest construction on that exact lowered posture.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One local FK/ROM source accompanies the original two ordered owner calls; both actual rise branches delegate here instead of constructing separate preparation scopes.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Raw hip lowering keeps its existing no-ROM policy; hand observations retain canonical joint projection, relevant fits and fallback. No planted point, contact progress, arm target, trajectory or tolerance changes.
 * @evidence contracts/development/implementation.md#efficient-algorithms A lazy exact reader and genuine static ROM metadata serve the bounded hip/hand observations of one current posture. Lowering's two-plant arithmetic and all required hand pose/fit work still run; no numerical speedup is claimed.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only same-evaluation exact FK dependencies and unchanged body/ROM metadata are shared. Changed lowered root and current joints remain actual inputs; no raw or solved posture is memoized between phases or queries.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local borrowed/owned FK and ROM sources end with return or throw. Only the current returned posture/goals escape, without a stored workspace, body preparation callback, queried time or history.
 */
export function riseRested(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  rests: Partial<Record<"left" | "right", IAutoMovieVector3>> | undefined,
  yaw: number,
  share: number,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: ReturnType<typeof prepareHumanPostureProjection>,
): IAutoMovieMotionHumanPosture {
  if (share <= 0)
    return resolveHumanPosture.lower(body, posture, undefined, resolution);
  const read: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution(resolution);
  const project: ReturnType<typeof prepareHumanPostureProjection> =
    projection ?? prepareHumanPostureProjection(body);
  return seated.rested(
    body,
    resolveHumanPosture.lower(body, posture, undefined, read),
    rests,
    yaw,
    share,
    read,
    project,
  );
}
