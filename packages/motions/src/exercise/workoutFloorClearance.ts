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
 * Prepare the workout's floor penetration over its observed colliders: how
 * far the lowest of them sinks under the floor, zero when none does. The body
 * stays unchanged for the plan; each read resolves and measures its current
 * complete posture.
 *
 * @param body The unchanged body and its neutral collider owner.
 * @param requested The collider bone names this floor observation reads.
 * @returns A current-posture reader of penetration in metres, optionally borrowing exact FK and genuine ROM metadata only during that synchronous read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the unchanged plan geometry, the current complete pose, the collider demand, the world-metre result and the synchronous metadata loans.
 * @evidence contracts/development/implementation.md#principled-implementation The complete joint and goal solve, then the colliders' exact floor minimum against zero, negated.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The demanded FK and the collider floor minimum's one owner (`HumanColliders.prepareMinima`) are prepared once; each read feeds its current bones to them.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every selected shape and the posture's projection and fit remain; no support tolerance or penetration bound changes.
 * @evidence contracts/development/implementation.md#efficient-algorithms The name preparation and collider selection run once per plan; each read computes the observed ancestry and O(S) exact shape minima.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The minimum is the colliders' owner's; only the unchanged body, names and neutral geometry are prepared, and any borrowed FK/ROM metadata ends within the read.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns the bounded name and collider preparation until release; only a clearance scalar returns.
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
  const minimum: ReturnType<typeof HumanColliders.prepareMinima> =
    HumanColliders.prepareMinima(body, [requested]);
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
    return -Math.min(0, minimum(bones)[0]!);
  };
}
