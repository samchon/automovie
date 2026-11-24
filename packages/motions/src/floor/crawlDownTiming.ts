import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Time the crawl's support-transfer keys by cumulative limb-joint travel. The
 * first descent fixes the pace at the supplied sitting duration.
 *
 * @param body The unchanged performer.
 * @param keys Ordered support-transfer postures, with a nonzero first
 *   transition.
 * @param sit Seconds assigned to the first transition.
 * @returns Each key's seconds from the first, starting at zero.
 */
export function crawlDownTiming(
  body: IAutoMovieMotionHumanBody,
  keys: readonly IAutoMovieMotionHumanPosture[],
  sit: number,
): number[] {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const projection: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(body);
  const frames: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    DEMAND,
  );
  const bones: ReturnType<typeof poseBones>[] = keys.map(
    (key: IAutoMovieMotionHumanPosture): ReturnType<typeof poseBones> =>
      frames(
        resolveHumanPosture.seeded(
          body,
          key,
          undefined,
          undefined,
          resolution,
          undefined,
          projection,
        ).pose,
        resolution(),
      ),
  );
  const travel: number[] = [0];
  for (let i: number = 1; i < bones.length; i++)
    travel.push(
      travel[i - 1]! +
        TRAVELLING.reduce(
          (sum: number, bone: AutoMovieHumanoidBone): number =>
            sum +
            Vector3.length(
              Vector3.subtract(
                bones[i]!.get(bone)!.worldPosition,
                bones[i - 1]!.get(bone)!.worldPosition,
              ),
            ),
          0,
        ),
    );
  return travel.map(
    (distance: number): number => (sit * distance) / travel[1]!,
  );
}

/** Preserve the original left-then-right limb reduction order. */
const TRAVELLING: readonly AutoMovieHumanoidBone[] = (
  ["left", "right"] as const
).flatMap((side: AutoMovieHumanSide): AutoMovieHumanoidBone[] => [
  `${side}UpperLeg`,
  `${side}LowerLeg`,
  `${side}Foot`,
  `${side}UpperArm`,
  `${side}LowerArm`,
  `${side}Hand`,
]);

/** FK returns the same twelve travel joints used by the ordered reduction. */
const DEMAND: ReadonlySet<AutoMovieHumanoidBone> = new Set(TRAVELLING);
