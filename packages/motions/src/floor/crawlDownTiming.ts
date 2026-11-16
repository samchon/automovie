import { Vector3 } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Time the crawl's support-transfer keys by cumulative limb-joint travel.
 * The first descent fixes the pace at the supplied sitting duration.
 *
 * @param body The unchanged performer.
 * @param keys Ordered support-transfer postures, with a nonzero first transition.
 * @param sit Seconds assigned to the first transition.
 * @returns Each key's seconds from the first, starting at zero.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States ordered keys, the positive first-travel premise, seconds and the sitting pace.
 * @evidence contracts/development/implementation.md#principled-implementation Retains the same sum of twelve limb-joint displacement lengths between adjacent keys and the same cumulative-travel ratio to the first transition.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One synchronous key-resolution pass and one ordered travel reduction produce the times.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every key's actual limb fits, canonical clamp/digits and all twelve original travel measurements remain; no timing coefficient or motion sample changes.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each of K keys demands only the twelve measured joint outputs and their ancestry; O(K) key maps and the existing ordered displacement reduction remain.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One exact dependency reader serves actual resolution and final FK throughout this synchronous body operation; maps are not reused for different keys.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader and K fresh maps end with this helper; only K scalar key times enter the returned crawl plan.
 */
export function crawlDownTiming(
  body: IHumanBody,
  keys: readonly IHumanPosture[],
  sit: number,
): number[] {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const bones: ReturnType<typeof poseBones>[] = keys.map(
    (key: IHumanPosture): ReturnType<typeof poseBones> =>
      poseBones(
        body,
        resolveHumanPosture.seeded(body, key, undefined, undefined, resolution)
          .pose,
        resolution(),
        DEMAND,
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
).flatMap((side: "left" | "right"): AutoMovieHumanoidBone[] => [
  `${side}UpperLeg`,
  `${side}LowerLeg`,
  `${side}Foot`,
  `${side}UpperArm`,
  `${side}LowerArm`,
  `${side}Hand`,
]);

/** FK returns the same twelve travel joints used by the ordered reduction. */
const DEMAND: ReadonlySet<AutoMovieHumanoidBone> = new Set(TRAVELLING);
