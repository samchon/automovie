import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/HumanColliders";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/**
 * Prepare the workout's floor penetration over its observed colliders: how far
 * the lowest of them sinks under the floor, zero when none does. The body stays
 * unchanged for the plan; each read resolves and measures its current complete
 * posture.
 *
 * @param body The unchanged body and its neutral collider owner.
 * @param requested The collider bone names this floor observation reads.
 * @returns A current-posture reader of penetration in metres, optionally
 *   borrowing exact FK and genuine ROM metadata only during that synchronous
 *   read.
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
