import { getConstraint } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
  IAutoMovieVector3,
} from "@automovie/interface";

import { readHumanBone } from "../body/readHumanBone";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import type { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";

/**
 * Test the available vertical leg travel above the two original ankle plants.
 *
 * @param body The measured leg lengths and knee domains.
 * @param keyed The candidate trunk before the additional downward shift.
 * @param stance The original ankle positions.
 * @param sink The required downward travel in metres.
 * @param resolution The call's FK reader.
 * @returns Whether both hips remain above reachable planted ankles.
 * @evidence contracts/development/common.md#meaningful-documentation States each physical quantity and predicate.
 * @evidence contracts/development/implementation.md#principled-implementation The limb's measured link lengths and actual knee flexion limit bound the shortening of the hip-to-ankle span.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve both hips and apply the same bound to each leg.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original foot positions and actual ROM remain inputs.
 * @evidence contracts/development/implementation.md#efficient-algorithms A single hip FK reading and two scalar length bounds determine admission.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both tests borrow the same pose resolution.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns only a boolean and retains no pose.
 */
export function kissCanLower(
  body: IAutoMovieMotionHumanBody,
  keyed: IAutoMovieMotionHumanPosture,
  stance: IAutoMovieMotionHumanRise.Stance,
  sink: number,
  resolution: ReturnType<typeof prepareHumanPoseResolution>,
): boolean {
  const hips: ReturnType<typeof HumanTrunk.resolve> = HumanTrunk.resolve(
    body,
    keyed,
    keyed.joints,
    resolution,
    new Set<AutoMovieHumanoidBone>(["leftUpperLeg", "rightUpperLeg"]),
  );
  return (["left", "right"] as const).every(
    (side: AutoMovieHumanSide): boolean => {
      const name: AutoMovieHumanoidBone = `${side}LowerLeg`;
      const range = getConstraint(
        name,
        readHumanBone(body, name)?.constraint ?? null,
      )?.flexion;
      if (range === null || range === undefined) return false;
      const hip: IAutoMovieVector3 = hips.get(`${side}UpperLeg`)!.worldPosition;
      const ankle: IAutoMovieVector3 = stance[side].ankle;
      const slack: number = lowerHumanPosture.short(
        body,
        hip,
        ankle,
        range.max,
      );
      return hip.y - sink >= ankle.y && sink <= slack;
    },
  );
}
