import { physicalShapeBounds } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Prepare the workout's original floor penetration over its actual observed
 * colliders. The body and selected neutral geometry stay unchanged for this
 * plan; each read still resolves and measures its current complete posture.
 *
 * @param body The unchanged body and its neutral collider owner.
 * @param requested Actual collider bone names selected for this floor observation.
 * @returns A current-posture reader of penetration in metres, optionally borrowing exact FK and genuine ROM metadata only during that synchronous read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States unchanged plan geometry, current complete pose, actual neutral-collider demand, world-metre result and synchronous reader metadata loans.
 * @evidence contracts/development/implementation.md#principled-implementation Keeps the canonical complete joint/goal solve, actual collider world placement and ordered minimum of exact physicalShapeBounds.min.y against zero, returning its original negation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed demanded FK and neutral collider selection are prepared once; each read feeds their current bones into one existing placement and floor reduction. The action owns its observed collider names.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every selected shape and actual pose projection/fit remains; demand derives from HumanColliders.bones rather than an incomplete raw profile list, and no support tolerance or penetration bound changes.
 * @evidence contracts/development/implementation.md#efficient-algorithms Neutral selection and FK name preparation run once per plan; current requested FK computes observed ancestry, followed by O(S) exact bounds for S selected shapes. Query loans share ROM/FK prerequisites with actual pin and endpoint observations.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only unchanged body, names and neutral geometry are prepared for the plan. Each current posture and every selected collider is actually resolved and measured; any borrowed FK/ROM metadata ends within that read.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns bounded demanded-name and neutral-geometry preparation until release. Current loan wrappers, pose and placed records end on return or throw; only a clearance scalar returns, without a retained posed answer or query history.
 */
export function workoutFloorClearance(
  body: IAutoMovieMotionHumanBody,
  requested: ReadonlySet<AutoMovieHumanoidBone>,
): (
  posture: IAutoMovieMotionHumanPosture,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: ReturnType<typeof prepareHumanPostureProjection>,
) => number {
  const frames: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    requested,
  );
  const place: ReturnType<typeof HumanColliders.preparePlaced> =
    HumanColliders.preparePlaced(body, requested);
  return (
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): number => {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const bones: ReturnType<typeof poseBones> = frames(
      resolveHumanPosture.seeded(
        body,
        posture,
        undefined,
        undefined,
        read,
        undefined,
        projection,
      ).pose,
      read(),
    );
    let lowest: number = 0;
    for (const segment of place(bones))
      for (const shape of segment.shapes)
        lowest = Math.min(
          lowest,
          physicalShapeBounds(segment.pose, shape).min.y,
        );
    return -lowest;
  };
}
